import json
from uuid import UUID
import uuid
from typing import Optional, Dict, Any
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.database.models.user import User
from src.database.models.chat import Chat, Draft
from src.database.models.connection import DatabaseConnection
from src.repositories.chat_repo import ChatRepository

from src.services.llm_service import LLMService
from src.services.sql_generation_service import SQLGenerationService
from src.services.distributed_db import DistributedDatabaseService
from src.services.schema_service import SchemaService
from src.services.relationship_inference_service import RelationshipInferenceService
from src.services.orchestrator_service import OrchestratorService
from src.services.catalog_service import CatalogService

from src.models.api.chats import ChatCreateRequest, PromptRequest, ReviseRequest, ClarificationAnswer
from src.models.schemas.chat import ChatRead, ChatStatus, SchemaSnapshot, DraftRead, ExecutionStatus
from src.utils.config import settings

import logging

logger = logging.getLogger(__name__)

# In-memory registry for active orchestrator sessions per chat
# Key: chat_id (UUID), Value: OrchestratorService instance
_ORCHESTRATOR_SESSIONS: Dict[UUID, OrchestratorService] = {}


async def _get_or_create_orchestrator(chat_id: UUID) -> OrchestratorService:
    """
    Retrieves or initializes an orchestrator for the given chat session.
    """
    if chat_id not in _ORCHESTRATOR_SESSIONS:
        db_service = DistributedDatabaseService(
            host="trino", port=settings.TRINO_PORT, user="trino"
        )
        llm_service = LLMService()
        schema_service = SchemaService(db_service)
        inference_service = RelationshipInferenceService(schema_service, llm_service)
        sql_service = SQLGenerationService(llm_service)

        orchestrator = OrchestratorService(
            db_service=db_service,
            schema_service=schema_service,
            inference_service=inference_service,
            sql_service=sql_service,
            llm_service=llm_service
        )

        _ORCHESTRATOR_SESSIONS[chat_id] = orchestrator

    return _ORCHESTRATOR_SESSIONS[chat_id]


class ChatController:
    @staticmethod
    def _map_draft(draft: Draft) -> DraftRead:
        return DraftRead(
            status=draft.status,
            metrics=draft.metrics if isinstance(draft.metrics, list) else [],
            dimensions=draft.dimensions if isinstance(draft.dimensions, list) else [],
            filters=draft.filters if isinstance(draft.filters, list) else [],
            sql=draft.sql,
            message=draft.message if hasattr(draft, 'message') else None,
            question=draft.question if hasattr(draft, 'question') else None,
            explanation=draft.explanation if hasattr(draft, 'explanation') else None,
        )

    @staticmethod
    async def create_chat(db: AsyncSession, request: ChatCreateRequest, user: User) -> ChatRead:
        connection_id = request.connection_ids[0] if request.connection_ids else None

        chat = Chat(
            title=request.name or f"Chat {uuid.uuid4().hex[:8]}",
            status="idle" if not connection_id else "ready_for_prompt",
            user_id=user.id,
            connection_id=connection_id
        )
        chat = await ChatRepository.create_chat(db, chat)

        return ChatRead(
            id=chat.id,
            name=chat.title,
            status=ChatStatus(chat.status) if chat.status else ChatStatus.IDLE,
            created_at=chat.created_at,
            updated_at=chat.updated_at
        )

    @staticmethod
    async def get_chat(db: AsyncSession, chat_id: UUID, user: User) -> ChatRead:
        chat = await ChatRepository.get_chat_by_id_and_user(db, chat_id, user.id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")

        return ChatRead(
            id=chat.id,
            name=chat.title,
            status=ChatStatus(chat.status) if chat.status else ChatStatus.IDLE,
            created_at=chat.created_at,
            updated_at=chat.updated_at
        )

    @staticmethod
    async def delete_chat(db: AsyncSession, chat_id: UUID, user: User) -> None:
        chat = await ChatRepository.get_chat_by_id_and_user(db, chat_id, user.id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")

        # Clean up orchestrator session if exists
        _ORCHESTRATOR_SESSIONS.pop(chat_id, None)
        await ChatRepository.delete_chat(db, chat)

    @staticmethod
    async def get_schema_snapshot(db: AsyncSession, chat_id: UUID, user: User) -> SchemaSnapshot:
        chat = await ChatRepository.get_chat_by_id_and_user(db, chat_id, user.id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")

        return SchemaSnapshot(
            tables=[{"name": "sales", "columns": ["id", "amount", "date"]}],
            relationships=[{"from": "sales.product_id", "to": "products.id"}]
        )

    @staticmethod
    async def submit_prompt(
        db: AsyncSession,
        chat_id: UUID,
        request: PromptRequest,
        user: User,
        llm_service: LLMService
    ) -> DraftRead:
        chat = await ChatRepository.get_chat_by_id_and_user(db, chat_id, user.id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")

        # Use OrchestratorService for smart generation with retries
        try:
            orchestrator = await _get_or_create_orchestrator(chat_id)

            # Initialize orchestrator with active catalogs if not done yet
            if not orchestrator.active_catalogs:
                # Try to get catalogs from DB, fallback to empty list
                try:
                    from src.repositories.catalog_repo import CatalogRepository
                    catalog_repo = CatalogRepository(db)
                    catalogs = await catalog_repo.list_active_catalogs()
                    catalog_names = [c.name for c in catalogs]
                    await orchestrator.initialize_session(catalog_names)
                except Exception as e:
                    logger.warning(f"Could not load catalogs: {e}")
                    await orchestrator.initialize_session([])

            result = await orchestrator.execute_user_query(request.prompt)
        except Exception as e:
            logger.error(f"Orchestrator error: {e}")
            result = {"status": "error", "message": str(e)}

        # Map orchestrator result to draft
        draft_status = "draft"
        sql = None
        message = None
        question = None
        explanation = None

        if result.get("status") == "clarification":
            draft_status = "clarification"
            question = result.get("question")
        elif result.get("status") == "error":
            draft_status = "error"
            message = result.get("message")
        elif result.get("status") == "success":
            draft_status = "success"
            sql = result.get("sql")
            explanation = result.get("explanation")

        draft = Draft(
            chat_id=chat.id,
            status=draft_status,
            sql=sql,
            metrics=[],
            dimensions=[],
            filters=[]
        )
        draft = await ChatRepository.create_draft(db, draft)

        # Update chat status
        status_map = {
            "clarification": "awaiting_clarification",
            "error": "ready_for_prompt",
            "success": "completed",
            "draft": "draft_ready"
        }
        chat.status = status_map.get(draft_status, "draft_ready")
        await ChatRepository.update_chat(db, chat)

        return DraftRead(
            status=draft_status,
            metrics=[],
            dimensions=[],
            filters=[],
            sql=sql,
            message=message,
            question=question,
            explanation=explanation,
            headers=result.get("headers"),
            data=result.get("data"),
        )

    @staticmethod
    async def get_draft(db: AsyncSession, chat_id: UUID, user: User) -> DraftRead:
        draft = await ChatRepository.get_latest_draft(db, chat_id, user.id)
        if not draft:
            raise HTTPException(status_code=404, detail="Draft not found")
        return ChatController._map_draft(draft)

    @staticmethod
    async def revise_draft(db: AsyncSession, chat_id: UUID, request: ReviseRequest, user: User) -> DraftRead:
        draft = await ChatRepository.get_latest_draft(db, chat_id, user.id)
        if not draft:
            raise HTTPException(status_code=404, detail="Draft not found")

        chat = await ChatRepository.get_chat_by_id(db, chat_id)
        if chat:
            await ChatRepository.update_chat(db, chat)

        return ChatController._map_draft(draft)

    @staticmethod
    async def confirm_draft(db: AsyncSession, chat_id: UUID, user: User) -> DraftRead:
        draft = await ChatRepository.get_latest_draft(db, chat_id, user.id)
        if not draft:
            raise HTTPException(status_code=404, detail="Draft not found")

        draft.status = "confirmed"
        draft = await ChatRepository.update_draft(db, draft)

        chat = await ChatRepository.get_chat_by_id(db, chat_id)
        if chat:
            chat.status = "executing"
            await ChatRepository.update_chat(db, chat)

        return ChatController._map_draft(draft)

    @staticmethod
    async def submit_clarification(db: AsyncSession, chat_id: UUID, answer: ClarificationAnswer, user: User) -> DraftRead:
        chat = await ChatRepository.get_chat_by_id_and_user(db, chat_id, user.id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")

        # Use orchestrator to handle clarification with retry logic
        clarification_text = answer.custom_answer or (
            answer.selected_options[0] if answer.selected_options else ""
        )
        if not clarification_text:
            raise HTTPException(status_code=400, detail="Clarification text is required")

        try:
            orchestrator = await _get_or_create_orchestrator(chat_id)
            result = await orchestrator.handle_clarification(clarification_text)
        except Exception as e:
            logger.error(f"Orchestrator clarification error: {e}")
            result = {"status": "error", "message": str(e)}

        # Map result
        draft_status = "draft"
        sql = None
        message = None
        question = None
        explanation = None

        if result.get("status") == "clarification":
            draft_status = "clarification"
            question = result.get("question")
        elif result.get("status") == "error":
            draft_status = "error"
            message = result.get("message")
        elif result.get("status") == "success":
            draft_status = "success"
            sql = result.get("sql")
            explanation = result.get("explanation")

        draft = Draft(
            chat_id=chat.id,
            status=draft_status,
            sql=sql,
            metrics=[],
            dimensions=[],
            filters=[]
        )
        draft = await ChatRepository.create_draft(db, draft)

        status_map = {
            "clarification": "awaiting_clarification",
            "error": "ready_for_prompt",
            "success": "completed",
            "draft": "draft_ready"
        }
        chat.status = status_map.get(draft_status, "draft_ready")
        await ChatRepository.update_chat(db, chat)

        return DraftRead(
            status=draft_status,
            metrics=[],
            dimensions=[],
            filters=[],
            sql=sql,
            message=message,
            question=question,
            explanation=explanation,
            headers=result.get("headers"),
            data=result.get("data"),
        )

    @staticmethod
    async def get_execution_status(db: AsyncSession, chat_id: UUID, user: User) -> ExecutionStatus:
        chat = await ChatRepository.get_chat_by_id_and_user(db, chat_id, user.id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")

        return ExecutionStatus(
            chat_id=chat.id,
            status="running" if chat.status == "executing" else "not_started",
            progress=0.5 if chat.status == "executing" else 0.0,
            result_url=None
        )
