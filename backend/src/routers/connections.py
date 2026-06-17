from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from src.dependencies.auth import get_current_user
from src.database.session import get_db
from src.database.models.user import User
from src.database.models.connection import DatabaseConnection
from src.models.api.connections import (
    ConnectionCreateRequest, ConnectionUpdateRequest, CheckConnectionResponse
)
from src.models.schemas.chat import DatabaseConnectionRead, SchemaSnapshot

router = APIRouter()

@router.post("", response_model=DatabaseConnectionRead, status_code=status.HTTP_201_CREATED)
async def create_connection(
    request: ConnectionCreateRequest, 
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    db_connection = DatabaseConnection(
        name=request.name,
        type=request.type,
        user_id=user.id
    )
    db.add(db_connection)
    await db.commit()
    await db.refresh(db_connection)
    
    return DatabaseConnectionRead(
        id=db_connection.id,
        name=db_connection.name,
        type=db_connection.type,
        status="connected"
    )

@router.get("", response_model=list[DatabaseConnectionRead])
async def list_connections(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(DatabaseConnection).where(DatabaseConnection.user_id == user.id)
    )
    connections = result.scalars().all()
    
    return [
        DatabaseConnectionRead(
            id=c.id,
            name=c.name,
            type=c.type,
            status="connected"
        ) for c in connections
    ]

@router.get("/{connection_id}", response_model=DatabaseConnectionRead)
async def get_connection(
    connection_id: UUID, 
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(DatabaseConnection).where(
            DatabaseConnection.id == connection_id,
            DatabaseConnection.user_id == user.id
        )
    )
    connection = result.scalar_one_or_none()
    
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
        
    return DatabaseConnectionRead(
        id=connection.id,
        name=connection.name,
        type=connection.type,
        status="connected"
    )

@router.patch("/{connection_id}", response_model=DatabaseConnectionRead)
async def update_connection(
    connection_id: UUID, 
    request: ConnectionUpdateRequest, 
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(DatabaseConnection).where(
            DatabaseConnection.id == connection_id,
            DatabaseConnection.user_id == user.id
        )
    )
    connection = result.scalar_one_or_none()
    
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    if request.name is not None:
        connection.name = request.name
    if request.type is not None:
        connection.type = request.type
        
    await db.commit()
    await db.refresh(connection)
    
    return DatabaseConnectionRead(
        id=connection.id,
        name=connection.name,
        type=connection.type,
        status="connected"
    )

@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_connection(
    connection_id: UUID, 
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(DatabaseConnection).where(
            DatabaseConnection.id == connection_id,
            DatabaseConnection.user_id == user.id
        )
    )
    connection = result.scalar_one_or_none()
    
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
        
    await db.delete(connection)
    await db.commit()
    return None

@router.get("/{connection_id}/check", response_model=CheckConnectionResponse)
async def check_connection(
    connection_id: UUID, 
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Just check if it exists in DB for now
    result = await db.execute(
        select(DatabaseConnection).where(
            DatabaseConnection.id == connection_id,
            DatabaseConnection.user_id == user.id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Connection not found")
    
    return CheckConnectionResponse(
        status="connected",
        error=None
    )

@router.post("/{connection_id}/finalize", response_model=SchemaSnapshot)
async def finalize_connection(
    connection_id: UUID, 
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(DatabaseConnection).where(
            DatabaseConnection.id == connection_id,
            DatabaseConnection.user_id == user.id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Connection not found")
    
    return SchemaSnapshot(
        tables=[{"name": "sales", "columns": ["id", "amount", "date"]}],
        relationships=[{"from": "sales.product_id", "to": "products.id"}]
    )
