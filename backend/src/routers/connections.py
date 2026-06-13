from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID, uuid4
from typing import List

from src.dependencies.auth import get_current_user
from src.models.api.connections import (
    ConnectionCreateRequest, ConnectionUpdateRequest, CheckConnectionResponse
)
from src.models.schemas.chat import DatabaseConnectionRead, SchemaSnapshot

router = APIRouter()

# Mock storage for connections
MOCK_CONNECTIONS = {}

@router.post("", response_model=DatabaseConnectionRead, status_code=status.HTTP_201_CREATED)
async def create_connection(request: ConnectionCreateRequest, user = Depends(get_current_user)):
    connection_id = uuid4()
    connection = DatabaseConnectionRead(
        id=connection_id,
        name=request.name,
        type=request.type,
        status="connected"
    )
    MOCK_CONNECTIONS[connection_id] = connection
    return connection

@router.get("", response_model=List[DatabaseConnectionRead])
async def list_connections(user = Depends(get_current_user)):
    return list(MOCK_CONNECTIONS.values())

@router.get("/{connection_id}", response_model=DatabaseConnectionRead)
async def get_connection(connection_id: UUID, user = Depends(get_current_user)):
    if connection_id not in MOCK_CONNECTIONS:
        raise HTTPException(status_code=404, detail="Connection not found")
    return MOCK_CONNECTIONS[connection_id]

@router.patch("/{connection_id}", response_model=DatabaseConnectionRead)
async def update_connection(connection_id: UUID, request: ConnectionUpdateRequest, user = Depends(get_current_user)):
    if connection_id not in MOCK_CONNECTIONS:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    connection = MOCK_CONNECTIONS[connection_id]
    if request.name is not None:
        connection.name = request.name
    if request.type is not None:
        connection.type = request.type
    
    return connection

@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_connection(connection_id: UUID, user = Depends(get_current_user)):
    if connection_id not in MOCK_CONNECTIONS:
        raise HTTPException(status_code=404, detail="Connection not found")
    del MOCK_CONNECTIONS[connection_id]
    return None

@router.get("/{connection_id}/check", response_model=CheckConnectionResponse)
async def check_connection(connection_id: UUID, user = Depends(get_current_user)):
    if connection_id not in MOCK_CONNECTIONS:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    return CheckConnectionResponse(
        status="connected",
        error=None
    )

@router.post("/{connection_id}/finalize", response_model=SchemaSnapshot)
async def finalize_connection(connection_id: UUID, user = Depends(get_current_user)):
    if connection_id not in MOCK_CONNECTIONS:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    return SchemaSnapshot(
        tables=[{"name": "sales", "columns": ["id", "amount", "date"]}],
        relationships=[{"from": "sales.product_id", "to": "products.id"}]
    )
