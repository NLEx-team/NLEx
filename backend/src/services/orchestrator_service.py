from enum import Enum
import asyncio
import json
import logging
from typing import Any, Dict, List, Optional

import numpy as np

from src.services.distributed_db import DistributedDatabaseService
from src.services.relationship_inference_service import RelationshipInferenceService
from src.services.sql_generation_service import SQLGenerationService
from src.services.llm_service import LLMService
from src.services.schema_service import SchemaService
from src.utils.config import settings
from src.models.schemas.catalog import CatalogConnection

logger = logging.getLogger(__name__)

# Max messages to keep in chat history (sliding window)
_MAX_HISTORY_LENGTH = 8

# Number of most relevant tables to include in LLM context (RAG)
_RAG_TOP_K = 10

class OrchestratorState(Enum):
    IDLE = "IDLE"
    CATALOG_CONNECTING = "CATALOG_CONNECTING"
    RELATIONSHIP_INFERRING = "RELATIONSHIP_INFERRING"
    AWAITING_USER_QUERY = "AWAITING_USER_QUERY"
    GENERATING_SQL = "GENERATING_SQL"
    CLARIFICATION_REQUIRED = "CLARIFICATION_REQUIRED"
    EXECUTING_SQL = "EXECUTING_SQL"
    FIXING_SQL = "FIXING_SQL"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class OrchestratorService:
    def __init__(
        self,
        db_service: DistributedDatabaseService,
        schema_service: SchemaService,
        inference_service: RelationshipInferenceService,
        sql_service: SQLGenerationService,
        llm_service: LLMService,
    ):
        self.db_service = db_service
        self.schema_service = schema_service
        self.inference_service = inference_service
        self.sql_service = sql_service
        self.llm_service = llm_service

        self.state = OrchestratorState.IDLE
        self.chat_history: List[Dict[str, str]] = []
        self.full_schema: Optional[Dict[str, Any]] = None
        self.last_result: Optional[Dict[str, Any]] = None
        self.max_retries = settings.MAX_SQL_RETRIES
        self.active_catalogs: List[str] = []
        self.on_transition = None

    async def _transition(self, to_state: OrchestratorState):
        logger.info(f"Orchestrator transition: {self.state.value} -> {to_state.value}")
        self.state = to_state
        if self.on_transition:
            import asyncio
            if asyncio.iscoroutinefunction(self.on_transition):
                await self.on_transition(to_state.value)
            else:
                self.on_transition(to_state.value)

    async def initialize_session(self, active_catalogs: Dict[str, str]):
        """
        Set up the session with the provided active catalogs (dict mapping cat_id to alias).
        """
        self.active_catalogs = active_catalogs
        if not self.active_catalogs:
            logger.warning("Initializing session with no active catalogs")

    async def infer_relationships(self):
        """
        Aggregates schemas from all active catalogs and infers relationships.
        Uses asyncio.gather() to fetch all catalogs in parallel.
        """
        if not self.active_catalogs:
            raise ValueError("No active catalogs found. Please connect and activate at least one catalog.")

        await self._transition(OrchestratorState.RELATIONSHIP_INFERRING)
        try:
            # Fetch all catalog schemas IN PARALLEL
            catalog_items = list(self.active_catalogs.items())
            tasks = [
                self.inference_service.get_augmented_schema(catalog_name)
                for catalog_name, _ in catalog_items
            ]
            catalog_schemas = await asyncio.gather(*tasks)
            
            # Aggregate results
            combined_schemas = []
            all_relationships = []
            
            for (catalog_name, catalog_alias), catalog_schema in zip(catalog_items, catalog_schemas):
                for schema in catalog_schema["schemas"]:
                    combined_schemas.append({
                        **schema,
                        "sql_catalog_name": catalog_name,
                        "ui_display_name": catalog_alias
                    })
                all_relationships.extend(catalog_schema.get("relationships", []))
            
            self.full_schema = {
                "catalogs": list(self.active_catalogs.keys()),
                "schemas": combined_schemas,
                "relationships": all_relationships
            }
            
            await self._transition(OrchestratorState.AWAITING_USER_QUERY)
            return self.full_schema
        except Exception as e:
            logger.error(f"Failed to infer relationships: {e}")
            await self._transition(OrchestratorState.FAILED)
            raise

    async def execute_user_query(self, query: str, language: str = "ru"):
        """
        3) Get the text prompt from the user and start the execution loop.
        """
        if not self.full_schema:
            await self.infer_relationships()
        
        self.last_result = None
        await self._transition(OrchestratorState.GENERATING_SQL)
        
        # --- RAG Filtering ---
        try:
            query_embedding_res = await asyncio.to_thread(self.llm_service.generate_embeddings, [query])
        except Exception as e:
            logger.error(f"Failed to generate query embedding: {e}")
            query_embedding_res = []

        filtered_schema = self._filter_schema_by_rag(query_embedding_res)
        return await self._processing_loop(query, filtered_schema, language=language)

    def _filter_schema_by_rag(self, query_embedding_res: list) -> Dict[str, Any]:
        """Filters full_schema to top-K relevant tables using cosine similarity. Strips embeddings."""
        if not query_embedding_res or not self.full_schema:
            return self._strip_embeddings(self.full_schema)
        
        query_emb = np.array(query_embedding_res[0])
        
        table_scores = []
        for s_idx, s in enumerate(self.full_schema.get("schemas", [])):
            for t_idx, t in enumerate(s.get("tables", [])):
                if "embedding" in t:
                    t_emb = np.array(t["embedding"])
                    score = np.dot(query_emb, t_emb) / (np.linalg.norm(query_emb) * np.linalg.norm(t_emb))
                    table_scores.append((score, s_idx, t_idx))
        
        if not table_scores:
            return self._strip_embeddings(self.full_schema)
        
        table_scores.sort(key=lambda x: x[0], reverse=True)
        top_k = set((s_idx, t_idx) for _, s_idx, t_idx in table_scores[:_RAG_TOP_K])
        
        filtered_schemas = []
        for s_idx, s in enumerate(self.full_schema.get("schemas", [])):
            filtered_tables = []
            for t_idx, t in enumerate(s.get("tables", [])):
                if (s_idx, t_idx) in top_k:
                    # Strip embedding inline — no deepcopy needed
                    filtered_tables.append({k: v for k, v in t.items() if k != "embedding"})
            if filtered_tables:
                s_copy = {k: v for k, v in s.items() if k != "tables"}
                s_copy["tables"] = filtered_tables
                filtered_schemas.append(s_copy)
                
        return {
            "catalogs": self.full_schema.get("catalogs", []),
            "schemas": filtered_schemas,
            "relationships": self.full_schema.get("relationships", []) 
        }

    @staticmethod
    def _strip_embeddings(schema: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Returns schema dict with embedding fields removed. No deepcopy."""
        if not schema:
            return schema
        stripped_schemas = []
        for s in schema.get("schemas", []):
            stripped_tables = [{k: v for k, v in t.items() if k != "embedding"} for t in s.get("tables", [])]
            s_copy = {k: v for k, v in s.items() if k != "tables"}
            s_copy["tables"] = stripped_tables
            stripped_schemas.append(s_copy)
        return {
            "catalogs": schema.get("catalogs", []),
            "schemas": stripped_schemas,
            "relationships": schema.get("relationships", [])
        }

    async def handle_clarification(self, clarification: str, language: str = "ru"):
        """
        4) User is able to clarify the query if LLM decided that it needs clarification.
        """
        if self.state != OrchestratorState.CLARIFICATION_REQUIRED:
            raise ValueError(f"Cannot handle clarification in state {self.state}")
            
        await self._transition(OrchestratorState.GENERATING_SQL)
        self.chat_history.append({"role": "user", "content": clarification})
        return await self._processing_loop(None, self.full_schema, language=language) 

    async def _processing_loop(self, user_prompt: Optional[str], schema_override: Optional[Dict[str, Any]] = None, language: str = "ru"):
        """
        5) execute SQL generated by SQLGenerationService.
        If error occurs - it should send it to LLM and make the next attempt.
        """
        attempts = 0
        current_prompt = user_prompt
        # schema_override is already stripped of embeddings by _filter_schema_by_rag
        active_schema = schema_override if schema_override else self._strip_embeddings(self.full_schema)
        schema_str = json.dumps(active_schema, ensure_ascii=False)
        
        while attempts <= self.max_retries:
            # Call LLM via SQLGenerationService
            result = await self.sql_service.generate_sql(
                user_prompt=current_prompt, 
                schema=schema_str,
                history=self.chat_history,
                language=language
            )
            
            # Save history: Prompt (if it was the first one) is handled by LLMService 
            # when it formats the message. But for subsequent calls we need to manage it.
            
            if not self.chat_history and current_prompt:
                # Store the very first prompt (formatted with schema) in history
                from src.utils.prompts import get_user_prompt_template
                initial_msg = get_user_prompt_template(language).format(schema=schema_str, user_prompt=current_prompt)
                self.chat_history.append({"role": "user", "content": initial_msg})
                current_prompt = None
            elif current_prompt:
                self.chat_history.append({"role": "user", "content": current_prompt})
                current_prompt = None
            
            # Sliding window: keep first message (with schema) + last N messages
            if len(self.chat_history) > _MAX_HISTORY_LENGTH:
                self.chat_history = [self.chat_history[0]] + self.chat_history[-(_MAX_HISTORY_LENGTH - 1):]

            if result["status"] == "clarification":
                await self._transition(OrchestratorState.CLARIFICATION_REQUIRED)
                self.chat_history.append({"role": "assistant", "content": json.dumps(result, ensure_ascii=False)})
                return result
                
            if result["status"] == "error":
                await self._transition(OrchestratorState.FAILED)
                self.chat_history.append({"role": "assistant", "content": json.dumps(result, ensure_ascii=False)})
                return result
                
            # status == "success"
            sql = result["sql"]
            self.chat_history.append({"role": "assistant", "content": json.dumps(result, ensure_ascii=False)})
            
            # Execute SQL
            await self._transition(OrchestratorState.EXECUTING_SQL)
            try:
                # 1. Get total rows
                count_sql = f"SELECT COUNT(*) FROM ({sql}) AS count_wrap"
                count_data = await self.db_service.execute_query_async(count_sql)
                total_rows = count_data[0][0] if count_data else 0
                
                # 2. Get preview data (execute original sql and fetchmany in python to preserve ORDER BY)
                preview_data = await self.db_service.execute_query_async_preview(sql)
                
                await self._transition(OrchestratorState.COMPLETED)
                success_result = {
                    "status": "success",
                    "data": preview_data,
                    "total_rows": total_rows,
                    "headers": result.get("headers"),
                    "explanation": result.get("explanation"),
                    "sql": sql,
                    "attempts": attempts + 1
                }
                if "_usage" in result:
                    success_result["_usage"] = result["_usage"]
                self.last_result = success_result
                return success_result
            except Exception as e:
                attempts += 1
                if attempts > self.max_retries:
                    await self._transition(OrchestratorState.FAILED)
                    return {
                        "status": "error", 
                        "message": f"Execution failed after {attempts} attempts: {str(e)}",
                        "sql": sql
                    }
                
                await self._transition(OrchestratorState.FIXING_SQL)
                error_msg = f"SQL execution error on attempt {attempts}: {str(e)}"
                logger.warning(error_msg)
                
                # Feedback to LLM
                self.chat_history.append({"role": "user", "content": error_msg})
                current_prompt = None # Next iteration uses history
                await self._transition(OrchestratorState.GENERATING_SQL)
        
        await self._transition(OrchestratorState.FAILED)
        return {"status": "error", "message": "Max retries reached"}
