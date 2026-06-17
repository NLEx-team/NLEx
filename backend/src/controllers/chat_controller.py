import logging
from typing import Dict, List, Optional, Any
from uuid import UUID, uuid4
from datetime import datetime

from src.services.orchestrator_service import OrchestratorService, OrchestratorState
from src.services.catalog_service import CatalogService
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

class ChatController:
    def __init__(self, catalog_service: CatalogService):
        self.catalog_service = catalog_service

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
            catalog_names = [c.name for c in active_catalogs]
            await orchestrator.initialize_session(catalog_names)
            
            _ORCHESTRATOR_SESSIONS[chat_id] = orchestrator
            
        return _ORCHESTRATOR_SESSIONS[chat_id]

    async def process_prompt(self, chat_id: UUID, prompt: str) -> Dict[str, Any]:
        orchestrator = await self.get_orchestrator(chat_id)
        result = await orchestrator.execute_user_query(prompt)
        return self._format_response(chat_id, orchestrator, result)

    async def process_clarification(self, chat_id: UUID, clarification: str) -> Dict[str, Any]:
        orchestrator = await self.get_orchestrator(chat_id)
        result = await orchestrator.handle_clarification(clarification)
        return self._format_response(chat_id, orchestrator, result)

    def _format_response(self, chat_id: UUID, orchestrator: OrchestratorService, result: Dict[str, Any]) -> Dict[str, Any]:
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

        return {
            "chat_id": chat_id,
            "status": state_map.get(orchestrator.state, "unknown"),
            "next_steps": next_steps,
            "result": result
        }
