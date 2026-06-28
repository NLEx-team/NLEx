from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from uuid import UUID
from ..schemas.chat import ChatRead, DatabaseConnectionRead, DraftRead, SchemaSnapshot, ClarificationQuestion

class ChatCreateRequest(BaseModel):
    name: Optional[str] = None
    catalog_ids: List[str] = []

class PromptRequest(BaseModel):
    prompt: str
    catalog_ids: List[str] = []

class ReviseRequest(BaseModel):
    instruction: str

class ClarificationAnswer(BaseModel):
    question_id: str
    selected_options: List[str]
    custom_answer: Optional[str] = None

class ChatUpdateRequest(BaseModel):
    name: str
