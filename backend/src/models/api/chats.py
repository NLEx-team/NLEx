from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel
from uuid import UUID
from ..schemas.chat import ChatRead, DatabaseConnectionRead, DraftRead, SchemaSnapshot, ClarificationQuestion


class ChartSpec(BaseModel):
    type: Literal["bar", "line", "pie", "area", "scatter"]
    title: Optional[str] = None
    x_column: Optional[str] = None
    y_columns: Optional[List[str]] = None
    category_column: Optional[str] = None
    value_column: Optional[str] = None
    stacked: Optional[bool] = None

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

class CreateFolderRequest(BaseModel):
    name: str

class UpdateFolderRequest(BaseModel):
    name: str

class MoveToFolderRequest(BaseModel):
    folder_id: Optional[str] = None
