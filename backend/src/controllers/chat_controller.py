import logging
import re
from typing import Dict, List, Optional, Any
from uuid import UUID, uuid4
from datetime import datetime

from src.services.orchestrator_service import OrchestratorService, OrchestratorState
from src.services.catalog_service import CatalogService
from src.services.excel_service import ExcelExportService
from src.services.distributed_db import DistributedDatabaseService
from src.services.schema_service import SchemaService
from src.services.relationship_inference_service import RelationshipInferenceService
from src.services.sql_generation_service import SQLGenerationService
from src.services.llm_service import LLMService
from src.utils.config import settings

logger = logging.getLogger(__name__)

# In-memory registry for active orchestrator sessions
# Key: chat_id, Value: OrchestratorService instance
_ORCHESTRATOR_SESSIONS: Dict[UUID, OrchestratorService] = {}

# Shared Excel export service instance
_excel_service = ExcelExportService()


from sqlalchemy.ext.asyncio import AsyncSession

class ChatController:
    def __init__(self, catalog_service: CatalogService, db: AsyncSession):
        self.catalog_service = catalog_service
        self.db = db
        self.excel_service = _excel_service

    @staticmethod
    def _generate_export_filename(sql: str, catalog_mapping: dict = None) -> str:
        """Generate a meaningful filename for the export based on SQL query.
        
        Replaces internal Trino catalog identifiers (cat_<hex>) with their
        human-readable display names so the downloaded file is recognisable.
        """
        cleaned_sql = sql
        if catalog_mapping:
            for trino_name, display_name in catalog_mapping.items():
                cleaned_sql = cleaned_sql.replace(trino_name, display_name)

        # Try to extract the table reference from the FROM clause.
        # Handles: FROM table, FROM schema.table, FROM catalog.schema.table
        match = re.search(
            r'FROM\s+["\']?([\w.]+)["\']?',
            cleaned_sql,
            re.IGNORECASE,
        )
        if match:
            full_ref = match.group(1)  # e.g. "MyDB.public.orders"
            parts = full_ref.split(".")
            table_name = parts[-1]  # always take the last segment (table)
            # Clean up
            table_name = re.sub(r'[^\w]', '_', table_name)
        else:
            table_name = 'query'

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"{table_name}_{timestamp}"

    async def get_orchestrator(self, chat_id: UUID, catalog_ids: List[str] = None) -> OrchestratorService:
        """
        Retrieves or initializes an orchestrator for the given chat session.
        Uses two-tier model strategy:
          - Inference model (LLM_MODEL_INFERENCE, default gpt-5.4-mini) for relationship inference
          - SQL model (LLM_MODEL_SQL, default gpt-5.4-mini) for SQL generation (RAG keeps context small)
        """
        if chat_id not in _ORCHESTRATOR_SESSIONS:
            active_catalogs = await self.catalog_service.get_active_catalogs()
            if catalog_ids:
                active_catalogs = [c for c in active_catalogs if str(c.id) in catalog_ids]

            # Fetch shared admin configuration or user's personal configuration
            from sqlalchemy import select, or_
            from src.database.models.llm_config import LlmConfiguration
            from src.database.models.chat import Chat
            
            chat_result = await self.db.execute(select(Chat).where(Chat.id == chat_id))
            chat = chat_result.scalar_one_or_none()
            user_id = chat.user_id if chat else None

            # Fetch LLM Config (prioritize personal over shared)
            llm_result = await self.db.execute(
                select(LlmConfiguration)
                .where(
                    LlmConfiguration.is_active == True,
                    or_(
                        LlmConfiguration.is_shared == True,
                        LlmConfiguration.admin_id == user_id
                    )
                )
                .order_by(LlmConfiguration.is_shared.asc())
            )
            llm_config = llm_result.scalars().first()
            
            # Fetch Proxy Config (prioritize personal over shared)
            proxy_result = await self.db.execute(
                select(LlmConfiguration)
                .where(
                    or_(
                        LlmConfiguration.is_proxy_shared == True,
                        LlmConfiguration.admin_id == user_id
                    )
                )
                .order_by(LlmConfiguration.is_proxy_shared.asc())
            )
            proxy_config = proxy_result.scalars().first()
            
            resolved_proxy_url = None
            if proxy_config:
                if proxy_config.proxy_mode == 'custom':
                    resolved_proxy_url = proxy_config.proxy_url
                elif proxy_config.proxy_mode == 'system':
                    resolved_proxy_url = settings.SYSTEM_PROXY_URL
            
            # Two-tier model strategy:
            #   - SQL model (LLM_MODEL_SQL, default gpt-5.4-mini) for SQL generation
            #   - Inference model (LLM_MODEL_INFERENCE, default gpt-5.4-mini) for relationship inference
            base_kwargs = {
                "api_key": llm_config.api_key if llm_config else None,
                "base_url": llm_config.base_url if llm_config else None,
                "proxy_url": resolved_proxy_url,
            }
            
            # SQL generation service: uses admin-configured model or LLM_MODEL_SQL fallback
            sql_llm = LLMService(
                **base_kwargs,
                model=llm_config.model_name if llm_config else settings.LLM_MODEL_SQL,
            )
            
            # Inference service: uses dedicated inference model (cheaper, good at pattern matching)
            inference_llm = LLMService(
                **base_kwargs,
                model=settings.LLM_MODEL_INFERENCE,
            )
            
            db_service = DistributedDatabaseService(
                host="trino", port=settings.TRINO_PORT, user="trino"
            )
            ss = SchemaService(db_service)
            ris = RelationshipInferenceService(ss, inference_llm)
            sqls = SQLGenerationService(sql_llm)
            
            orchestrator = OrchestratorService(
                db_service=db_service,
                schema_service=ss,
                inference_service=ris,
                sql_service=sqls,
                llm_service=sql_llm
            )
            
            trino_catalogs = {f"cat_{c.id.hex}": c.name for c in active_catalogs}
            await orchestrator.initialize_session(trino_catalogs)
            
            _ORCHESTRATOR_SESSIONS[chat_id] = orchestrator
            
        return _ORCHESTRATOR_SESSIONS[chat_id]

    def get_chat_status(self, chat_id: UUID) -> str:
        """Returns the current state of the orchestrator if it is running."""
        orchestrator = _ORCHESTRATOR_SESSIONS.get(chat_id)
        if not orchestrator:
            return "unknown"
        return orchestrator.state.value

    async def process_prompt(self, chat_id: UUID, prompt: str, catalog_ids: List[str] = None, language: str = "ru") -> Dict[str, Any]:
        orchestrator = await self.get_orchestrator(chat_id, catalog_ids)

        result = await orchestrator.execute_user_query(prompt, language=language)
        active_catalogs = await self.catalog_service.get_active_catalogs()
        return self._format_response(chat_id, orchestrator, result, active_catalogs)

    async def process_clarification(self, chat_id: UUID, clarification: str, language: str = "ru") -> Dict[str, Any]:
        orchestrator = await self.get_orchestrator(chat_id)

        result = await orchestrator.handle_clarification(clarification, language=language)
        active_catalogs = await self.catalog_service.get_active_catalogs()
        return self._format_response(chat_id, orchestrator, result, active_catalogs)

    def _format_response(self, chat_id: UUID, orchestrator: OrchestratorService, result: Dict[str, Any], active_catalogs: List[Any]) -> Dict[str, Any]:
        """
        Maps Orchestrator results and state to a public ChatResponse.
        """
        state_map = {
            OrchestratorState.IDLE: "idle",
            OrchestratorState.AWAITING_USER_QUERY: "ready_for_prompt",
            OrchestratorState.GENERATING_SQL: "processing",
            OrchestratorState.CLARIFICATION_REQUIRED: "awaiting_clarification",
            OrchestratorState.EXECUTING_SQL: "executing",
            OrchestratorState.FIXING_SQL: "fixing_sql",
            OrchestratorState.COMPLETED: "completed",
            OrchestratorState.FAILED: "error"
        }
        
        next_steps = []
        if orchestrator.state == OrchestratorState.CLARIFICATION_REQUIRED:
            next_steps.append("Provide clarification to proceed")
        elif orchestrator.state == OrchestratorState.COMPLETED:
            next_steps.append("You can ask another question about this data")
        elif orchestrator.state == OrchestratorState.FAILED:
            next_steps.append("Try rephrasing your request")
        elif orchestrator.state == OrchestratorState.AWAITING_USER_QUERY:
            next_steps.append("Submit a natural language prompt")

        original_sql = result.get("sql", "")
        
        # Beautify text by replacing technical catalog names with user aliases
        for cat in active_catalogs:
            trino_name = f"cat_{cat.id.hex}"
            
            # For SQL we might need quotes if there are spaces
            sql_display_name = f'"{cat.name}"' if " " in cat.name or not cat.name.isidentifier() else cat.name
            
            # Normal text replacement
            text_display_name = cat.name
            
            if "sql" in result and result.get("sql"):
                result["sql"] = result["sql"].replace(trino_name, sql_display_name)
                
            if "message" in result and result.get("message"):
                result["message"] = result["message"].replace(trino_name, text_display_name)
                
            if "explanation" in result and result.get("explanation"):
                result["explanation"] = result["explanation"].replace(trino_name, text_display_name)
                
            if result.get("status") == "clarification":
                if "question" in result and result.get("question"):
                    result["question"] = result["question"].replace(trino_name, text_display_name)
                if "options" in result and isinstance(result.get("options"), list):
                    result["options"] = [opt.replace(trino_name, text_display_name) for opt in result["options"]]
            
            if "data" in result and isinstance(result.get("data"), list):
                new_data = []
                for row in result["data"]:
                    new_row = []
                    for col in row:
                        if not isinstance(col, (int, float, str, bool, type(None))):
                            col = str(col)
                        if isinstance(col, str) and trino_name in col:
                            new_row.append(col.replace(trino_name, text_display_name))
                        else:
                            new_row.append(col)
                    new_data.append(new_row)
                result["data"] = new_data
                
            if "headers" in result and isinstance(result.get("headers"), list):
                result["headers"] = [
                    h.replace(trino_name, text_display_name) if isinstance(h, str) and trino_name in h else h 
                    for h in result["headers"]
                ]

        response = {
            "chat_id": chat_id,
            "status": state_map.get(orchestrator.state, "unknown"),
            "next_steps": next_steps,
            "result": result
        }

        # Add export_url when query completed successfully
        if (orchestrator.state == OrchestratorState.COMPLETED
                and result.get("status") == "success"):
            export_id = uuid4().hex
            
            catalog_mapping = {}
            for cat in active_catalogs:
                trino_name = f"cat_{cat.id.hex}"
                text_display_name = cat.name
                catalog_mapping[trino_name] = text_display_name

            export_filename = self._generate_export_filename(original_sql, catalog_mapping)

            self.excel_service.save_export_metadata(
                export_id,
                original_sql,
                result.get("headers", []),
                catalog_mapping,
                export_filename,
                chart=result.get("chart")
            )
            response["export_url"] = f"/chats/{chat_id}/export/{export_id}"
            response["export_filename"] = export_filename

        return response
