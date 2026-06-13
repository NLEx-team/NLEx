from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID, uuid4
from datetime import datetime
from typing import List

from src.dependencies.auth import get_current_user
from src.models.api.chats import (
    ChatCreateRequest, ConnectionCreateRequest, PromptRequest, 
    ReviseRequest, ClarificationAnswer
)
from src.models.schemas.chat import (
    ChatRead, ChatStatus, DatabaseConnectionRead, SchemaSnapshot,
    DraftRead, ExecutionStatus
)

router = APIRouter()

# Mock storage
MOCK_CHATS = {}
MOCK_CONNECTIONS = {}
MOCK_DRAFTS = {}

@router.post("", response_model=ChatRead, status_code=status.HTTP_201_CREATED)
async def create_chat(request: ChatCreateRequest, user = Depends(get_current_user)):
    chat_id = uuid4()
    chat = ChatRead(
        id=chat_id,
        name=request.name or f"Chat {chat_id.hex[:8]}",
        status=ChatStatus.IDLE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    MOCK_CHATS[chat_id] = chat
    return chat

@router.get("/{chat_id}", response_model=ChatRead)
async def get_chat(chat_id: UUID, user = Depends(get_current_user)):
    if chat_id not in MOCK_CHATS:
        raise HTTPException(status_code=404, detail="Chat not found")
    return MOCK_CHATS[chat_id]

@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat(chat_id: UUID, user = Depends(get_current_user)):
    if chat_id not in MOCK_CHATS:
        raise HTTPException(status_code=404, detail="Chat not found")
    del MOCK_CHATS[chat_id]
    if chat_id in MOCK_CONNECTIONS:
        del MOCK_CONNECTIONS[chat_id]
    if chat_id in MOCK_DRAFTS:
        del MOCK_DRAFTS[chat_id]
    return None

@router.post("/{chat_id}/connections", response_model=DatabaseConnectionRead)
async def add_connection(chat_id: UUID, request: ConnectionCreateRequest, user = Depends(get_current_user)):
    if chat_id not in MOCK_CHATS:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    connection_id = uuid4()
    connection = DatabaseConnectionRead(
        id=connection_id,
        name=request.name,
        type=request.type,
        status="connected"
    )
    
    if chat_id not in MOCK_CONNECTIONS:
        MOCK_CONNECTIONS[chat_id] = []
    MOCK_CONNECTIONS[chat_id].append(connection)
    
    return connection

@router.get("/{chat_id}/connections", response_model=List[DatabaseConnectionRead])
async def list_connections(chat_id: UUID, user = Depends(get_current_user)):
    if chat_id not in MOCK_CHATS:
        raise HTTPException(status_code=404, detail="Chat not found")
    return MOCK_CONNECTIONS.get(chat_id, [])

@router.post("/{chat_id}/connections:finalize", response_model=SchemaSnapshot)
async def finalize_connections(chat_id: UUID, user = Depends(get_current_user)):
    if chat_id not in MOCK_CHATS:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    chat = MOCK_CHATS[chat_id]
    chat.status = ChatStatus.READY_FOR_PROMPT
    chat.updated_at = datetime.utcnow()
    
    return SchemaSnapshot(
        tables=[{"name": "sales", "columns": ["id", "amount", "date"]}],
        relationships=[{"from": "sales.product_id", "to": "products.id"}]
    )

@router.get("/{chat_id}/schema", response_model=SchemaSnapshot)
async def get_schema_snapshot(chat_id: UUID, user = Depends(get_current_user)):
    if chat_id not in MOCK_CHATS:
        raise HTTPException(status_code=404, detail="Chat not found")
    return SchemaSnapshot(
        tables=[{"name": "sales", "columns": ["id", "amount", "date"]}],
        relationships=[{"from": "sales.product_id", "to": "products.id"}]
    )

@router.post("/{chat_id}/prompt", response_model=DraftRead)
async def submit_prompt(chat_id: UUID, request: PromptRequest, user = Depends(get_current_user)):
    if chat_id not in MOCK_CHATS:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    chat = MOCK_CHATS[chat_id]
    chat.status = ChatStatus.DRAFT_READY
    chat.updated_at = datetime.utcnow()
    
    draft = DraftRead(
        metrics=["total_sales"],
        dimensions=["date"],
        filters=[],
        status="draft"
    )
    MOCK_DRAFTS[chat_id] = draft
    return draft

@router.get("/{chat_id}/draft", response_model=DraftRead)
async def get_draft(chat_id: UUID, user = Depends(get_current_user)):
    if chat_id not in MOCK_CHATS:
        raise HTTPException(status_code=404, detail="Chat not found")
    if chat_id not in MOCK_DRAFTS:
        raise HTTPException(status_code=404, detail="Draft not found")
    return MOCK_DRAFTS[chat_id]

@router.post("/{chat_id}/draft:revise", response_model=DraftRead)
async def revise_draft(chat_id: UUID, request: ReviseRequest, user = Depends(get_current_user)):
    if chat_id not in MOCK_CHATS:
        raise HTTPException(status_code=404, detail="Chat not found")
    if chat_id not in MOCK_DRAFTS:
        raise HTTPException(status_code=404, detail="Draft not found")
    
    draft = MOCK_DRAFTS[chat_id]
    if "category" not in draft.dimensions:
        draft.dimensions.append("category")
    
    chat = MOCK_CHATS[chat_id]
    chat.updated_at = datetime.utcnow()
    return draft

@router.post("/{chat_id}/draft:confirm", response_model=DraftRead)
async def confirm_draft(chat_id: UUID, user = Depends(get_current_user)):
    if chat_id not in MOCK_CHATS:
        raise HTTPException(status_code=404, detail="Chat not found")
    if chat_id not in MOCK_DRAFTS:
        raise HTTPException(status_code=404, detail="Draft not found")
    
    draft = MOCK_DRAFTS[chat_id]
    draft.status = "confirmed"
    draft.sql = "SELECT SUM(amount) FROM sales GROUP BY date, category"
    
    chat = MOCK_CHATS[chat_id]
    chat.status = ChatStatus.EXECUTING
    chat.updated_at = datetime.utcnow()
    return draft

@router.post("/{chat_id}/clarifications", response_model=DraftRead)
async def submit_clarification(chat_id: UUID, answer: ClarificationAnswer, user = Depends(get_current_user)):
    if chat_id not in MOCK_CHATS:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    chat = MOCK_CHATS[chat_id]
    chat.status = ChatStatus.DRAFT_READY
    chat.updated_at = datetime.utcnow()
    
    draft = DraftRead(
        metrics=["total_sales"],
        dimensions=["date"],
        filters=[],
        status="draft"
    )
    MOCK_DRAFTS[chat_id] = draft
    return draft

@router.get("/{chat_id}/execution", response_model=ExecutionStatus)
async def get_execution_status(chat_id: UUID, user = Depends(get_current_user)):
    if chat_id not in MOCK_CHATS:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    chat = MOCK_CHATS[chat_id]
    return ExecutionStatus(
        chat_id=chat_id,
        status="running" if chat.status == ChatStatus.EXECUTING else "not_started",
        progress=0.5 if chat.status == ChatStatus.EXECUTING else 0.0,
        result_url=None
    )
