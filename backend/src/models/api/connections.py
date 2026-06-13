from typing import Optional, Dict, Any
from pydantic import BaseModel
from uuid import UUID

class ConnectionCreateRequest(BaseModel):
    name: str
    type: str
    connection_params: Dict[str, Any]

class ConnectionUpdateRequest(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    connection_params: Optional[Dict[str, Any]] = None

class CheckConnectionResponse(BaseModel):
    status: str
    error: Optional[str] = None
