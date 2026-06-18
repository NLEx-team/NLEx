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
    created_at: datetime
    updated_at: datetime

class DatabaseConnectionRead(BaseModel):
    id: UUID
    name: str
    type: str
    status: str

class SchemaSnapshot(BaseModel):
    tables: List[Dict[str, Any]]
    relationships: List[Dict[str, Any]]

class DraftRead(BaseModel):
    metrics: List[str] = []
    dimensions: List[str] = []
    filters: List[Dict[str, Any]] = []
    sql: Optional[str] = None
    status: str
    message: Optional[str] = None
    question: Optional[str] = None
    explanation: Optional[str] = None
    headers: Optional[List[str]] = None
    data: Optional[List[Dict[str, Any]]] = None

class ClarificationQuestion(BaseModel):
    id: str
    question: str
    options: List[str]

class ExecutionStatus(BaseModel):
    chat_id: UUID
    status: str
    progress: float
    result_url: Optional[str] = None
