from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from .auth import UserRead
from ..schemas.chat import ChatRead, DatabaseConnectionRead, DraftRead, SchemaSnapshot, ClarificationQuestion

class ChatCreateRequest(BaseModel):
    name: Optional[str] = None

class ConnectionCreateRequest(BaseModel):
    name: str
    type: str
    connection_params: Dict[str, Any]

class PromptRequest(BaseModel):
    prompt: str

class ReviseRequest(BaseModel):
    instruction: str

class ClarificationAnswer(BaseModel):
    question_id: str
    selected_options: List[str]
    custom_answer: Optional[str] = None
