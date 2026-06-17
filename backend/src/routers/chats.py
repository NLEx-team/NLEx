from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from src.dependencies.auth import get_current_user
from src.dependencies.llm import get_llm_service
from src.database.session import get_db
from src.database.models.user import User

from src.services.llm_service import LLMService

from src.models.api.chats import (
    ChatCreateRequest, PromptRequest, 
    ReviseRequest, ClarificationAnswer
)
from src.models.schemas.chat import (
    ChatRead, SchemaSnapshot,
    DraftRead, ExecutionStatus
)

from src.controllers.chat import ChatController

router = APIRouter()

@router.post("", response_model=ChatRead, status_code=status.HTTP_201_CREATED)
async def create_chat(
    request: ChatCreateRequest, 
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await ChatController.create_chat(db, request, user)

@router.get("/{chat_id}", response_model=ChatRead)
async def get_chat(
    chat_id: UUID, 
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await ChatController.get_chat(db, chat_id, user)

@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat(
    chat_id: UUID, 
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await ChatController.delete_chat(db, chat_id, user)
    return None

@router.get("/{chat_id}/schema", response_model=SchemaSnapshot)
async def get_schema_snapshot(
    chat_id: UUID, 
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await ChatController.get_schema_snapshot(db, chat_id, user)

@router.post("/{chat_id}/prompt", response_model=DraftRead)
async def submit_prompt(
    chat_id: UUID, 
    request: PromptRequest, 
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    llm_service: LLMService = Depends(get_llm_service)
):
    return await ChatController.submit_prompt(db, chat_id, request, user, llm_service)

@router.get("/{chat_id}/draft", response_model=DraftRead)
async def get_draft(
    chat_id: UUID, 
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await ChatController.get_draft(db, chat_id, user)

@router.post("/{chat_id}/draft:revise", response_model=DraftRead)
async def revise_draft(
    chat_id: UUID, 
    request: ReviseRequest, 
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await ChatController.revise_draft(db, chat_id, request, user)

@router.post("/{chat_id}/draft:confirm", response_model=DraftRead)
async def confirm_draft(
    chat_id: UUID, 
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await ChatController.confirm_draft(db, chat_id, user)

@router.post("/{chat_id}/clarifications", response_model=DraftRead)
async def submit_clarification(
    chat_id: UUID, 
    answer: ClarificationAnswer, 
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await ChatController.submit_clarification(db, chat_id, answer, user)

@router.get("/{chat_id}/execution", response_model=ExecutionStatus)
async def get_execution_status(
    chat_id: UUID, 
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await ChatController.get_execution_status(db, chat_id, user)
