from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
import uuid

from src.database.session import get_db
from src.dependencies.auth import get_current_user
from src.database.models.user import User, UserRole, UserProfile
from src.database.models.chat import Chat, ChatMessage
from src.database.models.llm_config import LlmConfiguration
from src.utils.config import settings


def _is_super_admin(user: User) -> bool:
    """The primary/eternal admin (from ADMIN_EMAIL) is protected: its role
    can't be changed and it can't be blocked or deleted."""
    return (user.email or "").lower() == (settings.ADMIN_EMAIL or "").lower()

router = APIRouter(prefix="/admin", tags=["admin"])

# --- Schemas ---

class LlmConfigBase(BaseModel):
    base_url: str
    api_key: str
    model_name: str
    is_shared: bool
    is_active: bool = True
    proxy_mode: str = "system"
    proxy_url: Optional[str] = None
    is_proxy_shared: bool = False

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
    is_blocked: bool = False
    is_super_admin: bool = False
    chat_count: int = 0
    request_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class AdminUserUpdateRequest(BaseModel):
    """Admin action on a user: block/unblock and/or change role."""
    is_blocked: Optional[bool] = None
    role: Optional[str] = None

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
        config.proxy_mode = data.proxy_mode
        config.proxy_url = data.proxy_url
        config.is_proxy_shared = data.is_proxy_shared
    else:
        config = LlmConfiguration(
            admin_id=admin.id,
            base_url=data.base_url,
            api_key=data.api_key,
            model_name=data.model_name,
            is_shared=data.is_shared,
            is_active=data.is_active,
            proxy_mode=data.proxy_mode,
            proxy_url=data.proxy_url,
            is_proxy_shared=data.is_proxy_shared
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
    proxy_url: Optional[str] = None

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
            model=data.model_name,
            proxy_url=data.proxy_url
        )
        response_text = ls.test_connection(data.prompt)
        return LlmTestResponse(success=True, response=response_text)
    except Exception as e:
        return LlmTestResponse(success=False, error=str(e))

class ProxyTestRequest(BaseModel):
    proxy_mode: str = "system"
    proxy_url: Optional[str] = None

class ProxyTestResponse(BaseModel):
    success: bool
    error: Optional[str] = None

@router.post("/proxy-config/test", response_model=ProxyTestResponse)
async def test_proxy_config(
    data: ProxyTestRequest,
    admin: User = Depends(require_admin)
):
    from src.utils.config import settings
    import httpx
    
    resolved_proxy = None
    if data.proxy_mode == 'custom':
        resolved_proxy = data.proxy_url
    elif data.proxy_mode == 'system':
        resolved_proxy = settings.SYSTEM_PROXY_URL
        
    if not resolved_proxy and data.proxy_mode != 'off':
         return ProxyTestResponse(success=False, error="No proxy URL provided or configured in system")

    try:
        proxies = [p.strip() for p in resolved_proxy.split(',')] if resolved_proxy else [None]
        errors = []
        for p in proxies:
            try:
                with httpx.Client(proxy=p, timeout=10.0) as client:
                    response = client.get("https://api.openai.com/v1")
                    return ProxyTestResponse(success=True)
            except Exception as e:
                errors.append(f"Proxy {p} failed: {str(e)}")
                
        return ProxyTestResponse(success=False, error="; ".join(errors))
    except Exception as e:
        return ProxyTestResponse(success=False, error=str(e))

def _user_to_stats(u: User, chat_count: int = 0, request_count: int = 0) -> UserStats:
    return UserStats(
        id=u.id,
        email=u.email,
        role=u.role.value if hasattr(u.role, 'value') else u.role,
        first_name=u.profile.first_name if u.profile else None,
        last_name=u.profile.last_name if u.profile else None,
        created_at=u.created_at.isoformat() if u.created_at else None,
        is_blocked=bool(u.is_blocked),
        is_super_admin=_is_super_admin(u),
        chat_count=chat_count,
        request_count=request_count,
    )


@router.get("/users", response_model=List[UserStats])
async def get_all_users(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(User).options(selectinload(User.profile)).order_by(User.created_at.desc())
    )
    users = result.scalars().all()

    # Grouped counts (avoid N+1): chats per user and AI requests (user messages) per user.
    chat_counts_res = await db.execute(
        select(Chat.user_id, func.count(Chat.id)).group_by(Chat.user_id)
    )
    chat_counts = {row[0]: row[1] for row in chat_counts_res.all()}

    req_counts_res = await db.execute(
        select(Chat.user_id, func.count(ChatMessage.id))
        .join(ChatMessage, ChatMessage.chat_id == Chat.id)
        .where(ChatMessage.role == "user")
        .group_by(Chat.user_id)
    )
    req_counts = {row[0]: row[1] for row in req_counts_res.all()}

    return [
        _user_to_stats(u, chat_counts.get(u.id, 0), req_counts.get(u.id, 0))
        for u in users
    ]


@router.patch("/users/{user_id}", response_model=UserStats)
async def admin_update_user(
    user_id: uuid.UUID,
    data: AdminUserUpdateRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Block/unblock a user and/or change their role. Admins cannot modify their own account here."""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot modify your own account")

    result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # The eternal admin is protected: cannot be demoted or blocked by anyone.
    if _is_super_admin(user):
        if data.role is not None and data.role != UserRole.ADMIN.value:
            raise HTTPException(status_code=403, detail="The primary admin's role cannot be changed")
        if data.is_blocked:
            raise HTTPException(status_code=403, detail="The primary admin cannot be blocked")

    if data.is_blocked is not None:
        user.is_blocked = data.is_blocked

    if data.role is not None:
        valid_roles = {UserRole.ADMIN.value, UserRole.VISITOR.value}
        if data.role not in valid_roles:
            raise HTTPException(status_code=400, detail="Invalid role")
        user.role = UserRole(data.role)

    await db.commit()
    await db.refresh(user)

    chat_count = (await db.execute(
        select(func.count(Chat.id)).where(Chat.user_id == user_id)
    )).scalar() or 0
    request_count = (await db.execute(
        select(func.count(ChatMessage.id))
        .join(Chat, ChatMessage.chat_id == Chat.id)
        .where(and_(Chat.user_id == user_id, ChatMessage.role == "user"))
    )).scalar() or 0

    return _user_to_stats(user, chat_count, request_count)

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

    if _is_super_admin(user):
        raise HTTPException(status_code=403, detail="The primary admin cannot be deleted")

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
