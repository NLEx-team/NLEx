from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from uuid import UUID
from ..schemas.chat import ChatRead, DatabaseConnectionRead, DraftRead, SchemaSnapshot, ClarificationQuestion

class ChatCreateRequest(BaseModel):
    name: Optional[str] = None
    connection_ids: List[UUID] = []

class PromptRequest(BaseModel):
    prompt: str

class ReviseRequest(BaseModel):
    instruction: str

class ClarificationAnswer(BaseModel):
    question_id: str
    selected_options: List[str]
    custom_answer: Optional[str] = None
