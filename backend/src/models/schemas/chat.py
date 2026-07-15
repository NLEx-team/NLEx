from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel

class ChatStatus(str, Enum):
    IDLE = "idle"
    COLLECTING_SCHEMAS = "collecting_schemas"
    READY_FOR_PROMPT = "ready_for_prompt"
    GENERATING_DRAFT = "generating_draft"
    DRAFT_READY = "draft_ready"
    AWAITING_CLARIFICATION = "awaiting_clarification"
    EXECUTING = "executing"
    COMPLETED = "completed"

class ChatBase(BaseModel):
    name: Optional[str] = None

class ChatRead(ChatBase):
    id: UUID
    status: ChatStatus
    catalog_ids: List[str]
    created_at: datetime
    updated_at: datetime

class ChatListItem(BaseModel):
    id: str
    title: str
    catalog_ids: List[str]
    updated_at: datetime

    class Config:
        from_attributes = True

class ChatMessageRead(BaseModel):
    id: str
    role: str
    blocks: List[Any]
    export_url: Optional[str] = None
    export_filename: Optional[str] = None
    total_tokens: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DatabaseConnectionRead(BaseModel):
    id: UUID
    name: str
    type: str
    status: str

class SchemaSnapshot(BaseModel):
    tables: List[Dict[str, Any]]
    relationships: List[Dict[str, Any]]

class DraftRead(BaseModel):
    metrics: List[str]
    dimensions: List[str]
    filters: List[Dict[str, Any]]
    sql: Optional[str] = None
    status: str

class ClarificationQuestion(BaseModel):
    id: str
    question: str
    options: List[str]

class ExecutionStatus(BaseModel):
    chat_id: UUID
    status: str
    progress: float
    result_url: Optional[str] = None
