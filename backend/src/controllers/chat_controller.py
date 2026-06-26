import logging
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

    async def get_orchestrator(self, chat_id: UUID, catalog_ids: List[str] = None) -> OrchestratorService:
        """
        Retrieves or initializes an orchestrator for the given chat session.
        If catalog_ids are provided and the session doesn't exist yet, only those catalogs are used.
        """
        if chat_id not in _ORCHESTRATOR_SESSIONS:
            # Initialize a new Orchestrator instance
            # Initialize with selected catalogs (or all active if none specified)
            active_catalogs = await self.catalog_service.get_active_catalogs()
            if catalog_ids:
                # Filter to only the requested catalog IDs
                active_catalogs = [c for c in active_catalogs if str(c.id) in catalog_ids]
            
            use_thinking_model = len(active_catalogs) > 1

            # Fetch shared admin configuration or user's personal configuration
            from sqlalchemy import select, or_
            from src.database.models.llm_config import LlmConfiguration
            from src.database.models.chat import Chat
            
            chat_result = await self.db.execute(select(Chat).where(Chat.id == chat_id))
            chat = chat_result.scalar_one_or_none()
            user_id = chat.user_id if chat else None

            # Prioritize personal (is_shared=False) over shared (is_shared=True)
            result = await self.db.execute(
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
            shared_config = result.scalars().first()
            
            if shared_config:
                ls = LLMService(
                    use_thinking_model=use_thinking_model,
                    api_key=shared_config.api_key,
                    base_url=shared_config.base_url,
                    model=shared_config.model_name,
                    proxy_url=shared_config.proxy_url
                )
            else:
                ls = LLMService(use_thinking_model=use_thinking_model)
            
            db_service = DistributedDatabaseService(
                host="trino", port=settings.TRINO_PORT, user="trino"
            )
            ss = SchemaService(db_service)
            ris = RelationshipInferenceService(ss, ls)
            sqls = SQLGenerationService(ls)
            
            orchestrator = OrchestratorService(
                db_service=db_service,
                schema_service=ss,
                inference_service=ris,
                sql_service=sqls,
                llm_service=ls
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

    async def process_prompt(self, chat_id: UUID, prompt: str, catalog_ids: List[str] = None) -> Dict[str, Any]:
        orchestrator = await self.get_orchestrator(chat_id, catalog_ids)

        result = await orchestrator.execute_user_query(prompt)
        active_catalogs = await self.catalog_service.get_active_catalogs()
        return self._format_response(chat_id, orchestrator, result, active_catalogs)

    async def process_clarification(self, chat_id: UUID, clarification: str) -> Dict[str, Any]:
        orchestrator = await self.get_orchestrator(chat_id)

        result = await orchestrator.handle_clarification(clarification)
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

            self.excel_service.save_export_metadata(
                export_id, 
                original_sql, 
                result.get("headers", []),
                catalog_mapping
            )
            response["export_url"] = f"/chats/{chat_id}/export/{export_id}"

        return response
