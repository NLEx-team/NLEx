from enum import Enum
import json
import logging
from typing import Any, Dict, List, Optional

from src.services.distributed_db import DistributedDatabaseService
from src.services.relationship_inference_service import RelationshipInferenceService
from src.services.sql_generation_service import SQLGenerationService
from src.services.llm_service import LLMService
from src.services.schema_service import SchemaService
from src.utils.config import settings
from src.models.schemas.catalog import CatalogConnection

logger = logging.getLogger(__name__)

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

    def _transition(self, to_state: OrchestratorState):
        logger.info(f"Orchestrator transition: {self.state.value} -> {to_state.value}")
        self.state = to_state

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
        """
        if not self.active_catalogs:
            raise ValueError("No active catalogs found. Please connect and activate at least one catalog.")

        self._transition(OrchestratorState.RELATIONSHIP_INFERRING)
        try:
            # Aggregate schemas from all active catalogs
            combined_schemas = []
            all_relationships = []
            
            for catalog_name, catalog_alias in self.active_catalogs.items():
                # RelationshipInferenceService.get_augmented_schema returns full schema for ONE catalog
                catalog_schema = await self.inference_service.get_augmented_schema(catalog_name)
                
                # Prepend catalog name to schemas for unambiguous referencing in SQL
                # The schema structure is {"catalog": "...", "schemas": [...], "relationships": [...]}
                for schema in catalog_schema["schemas"]:
                    combined_schemas.append({
                        **schema,
                        "catalog": catalog_name,
                        "catalog_alias": catalog_alias
                    })
                all_relationships.extend(catalog_schema.get("relationships", []))
            
            self.full_schema = {
                "catalogs": list(self.active_catalogs.keys()),
                "schemas": combined_schemas,
                "relationships": all_relationships
            }
            
            self._transition(OrchestratorState.AWAITING_USER_QUERY)
            return self.full_schema
        except Exception as e:
            logger.error(f"Failed to infer relationships: {e}")
            self._transition(OrchestratorState.FAILED)
            raise

    async def execute_user_query(self, query: str):
        """
        3) Get the text prompt from the user and start the execution loop.
        """
        if not self.full_schema:
            await self.infer_relationships()
        
        # Keep chat history so LLM retains context across multiple queries
        # self.chat_history = []
        self.last_result = None
        
        self._transition(OrchestratorState.GENERATING_SQL)
        return await self._processing_loop(query)

    async def handle_clarification(self, clarification: str):
        """
        4) User is able to clarify the query if LLM decided that it needs clarification.
        """
        if self.state != OrchestratorState.CLARIFICATION_REQUIRED:
            raise ValueError(f"Cannot handle clarification in state {self.state}")
            
        self._transition(OrchestratorState.GENERATING_SQL)
        # Append clarification to history
        self.chat_history.append({"role": "user", "content": clarification})
        return await self._processing_loop(None) # Continue with history

    async def _processing_loop(self, user_prompt: Optional[str]):
        """
        5) execute SQL generated by SQLGenerationService.
        If error occurs - it should send it to LLM and make the next attempt.
        """
        attempts = 0
        current_prompt = user_prompt
        schema_str = json.dumps(self.full_schema, ensure_ascii=False)
        
        while attempts <= self.max_retries:
            # Call LLM via SQLGenerationService
            result = self.sql_service.generate_sql(
                user_prompt=current_prompt, 
                schema=schema_str,
                history=self.chat_history
            )
            
            # Save history: Prompt (if it was the first one) is handled by LLMService 
            # when it formats the message. But for subsequent calls we need to manage it.
            
            if not self.chat_history and current_prompt:
                # Store the very first prompt (formatted with schema) in history
                # Actually, LLMService doesn't return the messages it sent.
                # We'll reconstruct it for consistency.
                from src.utils.prompts import USER_PROMPT_TEMPLATE
                initial_msg = USER_PROMPT_TEMPLATE.format(schema=schema_str, user_prompt=current_prompt)
                self.chat_history.append({"role": "user", "content": initial_msg})
                current_prompt = None
            elif current_prompt:
                # Store subsequent user prompts in history
                self.chat_history.append({"role": "user", "content": current_prompt})
                current_prompt = None

            if result["status"] == "clarification":
                self._transition(OrchestratorState.CLARIFICATION_REQUIRED)
                self.chat_history.append({"role": "assistant", "content": json.dumps(result, ensure_ascii=False)})
                return result
                
            if result["status"] == "error":
                self._transition(OrchestratorState.FAILED)
                self.chat_history.append({"role": "assistant", "content": json.dumps(result, ensure_ascii=False)})
                return result
                
            # status == "success"
            sql = result["sql"]
            self.chat_history.append({"role": "assistant", "content": json.dumps(result, ensure_ascii=False)})
            
            # Execute SQL
            self._transition(OrchestratorState.EXECUTING_SQL)
            try:
                data = await self.db_service.execute_query_async(sql)
                self._transition(OrchestratorState.COMPLETED)
                success_result = {
                    "status": "success",
                    "data": data,
                    "headers": result.get("headers"),
                    "explanation": result.get("explanation"),
                    "sql": sql,
                    "attempts": attempts + 1
                }
                self.last_result = success_result
                return success_result
            except Exception as e:
                attempts += 1
                if attempts > self.max_retries:
                    self._transition(OrchestratorState.FAILED)
                    return {
                        "status": "error", 
                        "message": f"Execution failed after {attempts} attempts: {str(e)}",
                        "sql": sql
                    }
                
                self._transition(OrchestratorState.FIXING_SQL)
                error_msg = f"SQL execution error on attempt {attempts}: {str(e)}"
                logger.warning(error_msg)
                
                # Feedback to LLM
                self.chat_history.append({"role": "user", "content": error_msg})
                current_prompt = None # Next iteration uses history
                self._transition(OrchestratorState.GENERATING_SQL)
        
        self._transition(OrchestratorState.FAILED)
        return {"status": "error", "message": "Max retries reached"}
