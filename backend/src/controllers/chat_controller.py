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


class ChatController:
    def __init__(self, catalog_service: CatalogService):
        self.catalog_service = catalog_service
        self.excel_service = _excel_service

    async def get_orchestrator(self, chat_id: UUID) -> OrchestratorService:
        """
        Retrieves or initializes an orchestrator for the given chat session.
        """
        if chat_id not in _ORCHESTRATOR_SESSIONS:
            # Initialize a new Orchestrator instance
            # We need to provide all dependencies. 
            # In a real app, these could be singletons or provided via DI.
            db_service = DistributedDatabaseService(
                host="trino", port=settings.TRINO_PORT, user="trino"
            )
            ss = SchemaService(db_service)
            ls = LLMService()
            ris = RelationshipInferenceService(ss, ls)
            sqls = SQLGenerationService(ls)
            
            orchestrator = OrchestratorService(
                db_service=db_service,
                schema_service=ss,
                inference_service=ris,
                sql_service=sqls,
                llm_service=ls
            )
            
            # Initialize with active catalogs
            active_catalogs = await self.catalog_service.get_active_catalogs()
            trino_catalogs = {f"cat_{c.id.hex}": c.name for c in active_catalogs}
            await orchestrator.initialize_session(trino_catalogs)
            
            _ORCHESTRATOR_SESSIONS[chat_id] = orchestrator
            
        return _ORCHESTRATOR_SESSIONS[chat_id]

    async def process_prompt(self, chat_id: UUID, prompt: str) -> Dict[str, Any]:
        orchestrator = await self.get_orchestrator(chat_id)

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

        # Beautify SQL by replacing technical catalog names with user aliases
        if "sql" in result and result.get("sql"):
            sql_str = result["sql"]
            for cat in active_catalogs:
                trino_name = f"cat_{cat.id.hex}"
                # Trino syntax: quote identifiers with spaces
                display_name = f'"{cat.name}"' if " " in cat.name or not cat.name.isidentifier() else cat.name
                sql_str = sql_str.replace(trino_name, display_name)
            result["sql"] = sql_str
            
        # Beautify clarification questions and options
        if result.get("status") == "clarification":
            for cat in active_catalogs:
                trino_name = f"cat_{cat.id.hex}"
                display_name = cat.name # No quotes for simple text display
                if "question" in result and result.get("question"):
                    result["question"] = result["question"].replace(trino_name, display_name)
                if "options" in result and isinstance(result.get("options"), list):
                    result["options"] = [opt.replace(trino_name, display_name) for opt in result["options"]]

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
            self.excel_service.generate_excel(
                export_id, 
                result.get("headers", []), 
                result.get("data", [])
            )
            response["export_url"] = f"/chats/{chat_id}/export/{export_id}"

        return response
