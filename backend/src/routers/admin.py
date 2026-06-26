from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
import uuid

from src.database.session import get_db
from src.dependencies.auth import get_current_user
from src.database.models.user import User, UserRole, UserProfile
from src.database.models.llm_config import LlmConfiguration

router = APIRouter(prefix="/admin", tags=["admin"])

# --- Schemas ---

class LlmConfigBase(BaseModel):
    base_url: str
    api_key: str
    model_name: str
    is_shared: bool
    is_active: bool = True

class LlmConfigRead(LlmConfigBase):
    id: uuid.UUID
    
    model_config = ConfigDict(from_attributes=True)

class UserStats(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    first_name: Optional[str]
    last_name: Optional[str]
    created_at: Optional[str]

    model_config = ConfigDict(from_attributes=True)

# --- Endpoints ---

def require_admin(user: User = Depends(get_current_user)):
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

@router.get("/llm-config", response_model=Optional[LlmConfigRead])
async def get_llm_config(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(LlmConfiguration).where(LlmConfiguration.admin_id == admin.id)
    )
    return result.scalar_one_or_none()

@router.post("/llm-config", response_model=LlmConfigRead)
async def create_or_update_llm_config(
    data: LlmConfigBase,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(LlmConfiguration).where(LlmConfiguration.admin_id == admin.id)
    )
    config = result.scalar_one_or_none()
    
    if config:
        config.base_url = data.base_url
        config.api_key = data.api_key
        config.model_name = data.model_name
        config.is_shared = data.is_shared
        config.is_active = data.is_active
    else:
        config = LlmConfiguration(
            admin_id=admin.id,
            base_url=data.base_url,
            api_key=data.api_key,
            model_name=data.model_name,
            is_shared=data.is_shared,
            is_active=data.is_active
        )
        db.add(config)
        
    await db.commit()
    await db.refresh(config)
    return config

class LlmTestRequest(BaseModel):
    base_url: str
    api_key: str
    model_name: str
    prompt: str = "Привет"

class LlmTestResponse(BaseModel):
    success: bool
    response: Optional[str] = None
    error: Optional[str] = None

@router.post("/llm-config/test", response_model=LlmTestResponse)
async def test_llm_config(
    data: LlmTestRequest,
    admin: User = Depends(require_admin)
):
    from src.services.llm_service import LLMService
    
    try:
        ls = LLMService(
            api_key=data.api_key,
            base_url=data.base_url,
            model=data.model_name
        )
        response_text = ls.test_connection(data.prompt)
        return LlmTestResponse(success=True, response=response_text)
    except Exception as e:
        return LlmTestResponse(success=False, error=str(e))

@router.get("/users", response_model=List[UserStats])
async def get_all_users(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(User).options(selectinload(User.profile)).order_by(User.created_at.desc())
    )
    users = result.scalars().all()
    
    res = []
    for u in users:
        res.append(UserStats(
            id=u.id,
            email=u.email,
            role=u.role.value if hasattr(u.role, 'value') else u.role,
            first_name=u.profile.first_name if u.profile else None,
            last_name=u.profile.last_name if u.profile else None,
            created_at=u.created_at.isoformat() if u.created_at else None
        ))
    return res

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: uuid.UUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    from src.database.models.chat import Chat
    from src.database.models.connection import DatabaseConnection
    
    # Fetch and delete user's chats first to trigger ORM cascades for drafts and messages
    chats_result = await db.execute(select(Chat).where(Chat.user_id == user_id))
    user_chats = chats_result.scalars().all()
    for chat in user_chats:
        await db.delete(chat)
        
    # Fetch and delete user's connections
    conn_result = await db.execute(select(DatabaseConnection).where(DatabaseConnection.user_id == user_id))
    user_conns = conn_result.scalars().all()
    for conn in user_conns:
        await db.delete(conn)
    
    await db.delete(user)
    await db.commit()
    return {"message": "User deleted"}
