import json
from uuid import UUID
import uuid
from typing import Optional
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

from src.models.api.chats import ChatCreateRequest, PromptRequest, ReviseRequest, ClarificationAnswer
from src.models.schemas.chat import ChatRead, ChatStatus, SchemaSnapshot, DraftRead, ExecutionStatus


class ChatController:
    @staticmethod
    def _map_draft(draft: Draft) -> DraftRead:
        return DraftRead(
            status=draft.status,
            metrics=draft.metrics if isinstance(draft.metrics, list) else [],
            dimensions=draft.dimensions if isinstance(draft.dimensions, list) else [],
            filters=draft.filters if isinstance(draft.filters, list) else [],
            sql=draft.sql
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
            
        await ChatRepository.delete_chat(db, chat)

    @staticmethod
    async def get_schema_snapshot(db: AsyncSession, chat_id: UUID, user: User) -> SchemaSnapshot:
        chat = await ChatRepository.get_chat_by_id_and_user(db, chat_id, user.id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
            
        # Mock logic as per MVP, will connect to schema service properly later if needed
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
            
        connection_id = chat.connection_id
        schema_text = "{}"
        
        if connection_id:
            # We fetch connection via db.execute here, could be moved to connection_repo
            conn_result = await db.execute(select(DatabaseConnection).where(DatabaseConnection.id == connection_id))
            connection = conn_result.scalar_one_or_none()
            if connection:
                try:
                    ddb = DistributedDatabaseService()
                    schema_service = SchemaService(ddb)
                    schema_data = await schema_service.get_full_schema(connection.name)
                    schema_text = json.dumps(schema_data, ensure_ascii=False)
                except Exception:
                    pass

        sql_service = SQLGenerationService(llm_service=llm_service)
        gen_result = sql_service.generate_sql(request.prompt, schema_text)
        
        draft_status = "draft"
        sql = None
        if gen_result.get("status") == "clarification":
            draft_status = "clarification"
        elif gen_result.get("status") == "success":
            sql = gen_result.get("sql")

        draft = Draft(
            chat_id=chat.id,
            status=draft_status,
            sql=sql,
            metrics=[],
            dimensions=[],
            filters=[]
        )
        draft = await ChatRepository.create_draft(db, draft)
        
        chat.status = "draft_ready"
        await ChatRepository.update_chat(db, chat)
        
        return ChatController._map_draft(draft)

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
        draft = await ChatRepository.get_latest_draft(db, chat_id, user.id)
        if not draft:
            raise HTTPException(status_code=404, detail="Draft not found")
            
        draft.status = "draft"
        draft = await ChatRepository.update_draft(db, draft)
        
        chat = await ChatRepository.get_chat_by_id(db, chat_id)
        if chat:
            chat.status = "draft_ready"
            await ChatRepository.update_chat(db, chat)
            
        return ChatController._map_draft(draft)

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
