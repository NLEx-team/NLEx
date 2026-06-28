from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from src.database.session import get_db
from src.database.models.user import User, UserRole
from src.database.models.chat import Chat, ChatMessage
from src.database.models.catalog import Catalog
from src.dependencies.auth import get_current_user

router = APIRouter()

@router.get("/")
async def get_user_analytics(
    scope: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    is_global = scope == "global" and user.role == UserRole.ADMIN

    # 1. Total Chats
    if is_global:
        result = await db.execute(select(func.count(Chat.id)))
    else:
        result = await db.execute(select(func.count(Chat.id)).where(Chat.user_id == user.id))
    total_chats = result.scalar() or 0

    from sqlalchemy.orm import selectinload

    # Fetch catalog names for mapping
    catalog_result = await db.execute(select(Catalog.id, Catalog.name))
    catalogs_map = {str(row.id): row.name for row in catalog_result}

    # 2. Total Requests & Tokens
    # To get user's messages, we join ChatMessage with Chat
    if is_global:
        stmt = (
            select(ChatMessage)
            .join(Chat, ChatMessage.chat_id == Chat.id)
            .options(selectinload(ChatMessage.chat).selectinload(Chat.user))
            .order_by(ChatMessage.created_at.desc())
        )
    else:
        stmt = (
            select(ChatMessage)
            .join(Chat, ChatMessage.chat_id == Chat.id)
            .options(selectinload(ChatMessage.chat).selectinload(Chat.user))
            .where(Chat.user_id == user.id)
            .order_by(ChatMessage.created_at.desc())
        )
    result = await db.execute(stmt)
    messages = result.scalars().all()

    total_requests = 0
    total_tokens = 0
    usage_by_date: Dict[str, Dict[str, int]] = {}
    
    # We will build history_list by looking at pairs of user -> assistant messages
    history_list = []
    
    chats_msgs: Dict[str, List[ChatMessage]] = {}
    for m in messages:
        chat_id_str = str(m.chat_id)
        if chat_id_str not in chats_msgs:
            chats_msgs[chat_id_str] = []
        chats_msgs[chat_id_str].append(m)

    for m in messages:
        date_str = m.created_at.strftime("%Y-%m-%d")
        if date_str not in usage_by_date:
            usage_by_date[date_str] = {"requests": 0, "tokens": 0}
            
        if m.role == "user":
            total_requests += 1
            usage_by_date[date_str]["requests"] += 1
        elif m.role == "assistant":
            if m.total_tokens:
                total_tokens += m.total_tokens
                usage_by_date[date_str]["tokens"] += m.total_tokens

    # Build history_list
    for chat_id, msgs in chats_msgs.items():
        # sort messages by created_at ascending
        msgs.sort(key=lambda x: x.created_at)
        for i in range(len(msgs) - 1):
            if msgs[i].role == "user" and msgs[i+1].role == "assistant":
                user_msg = msgs[i]
                asst_msg = msgs[i+1]
                
                query = ""
                for b in user_msg.blocks:
                    if b.get("type") == "text":
                        query += b.get("text", "")
                        
                sql = None
                for b in asst_msg.blocks:
                    if "sql" in b:
                        sql = b.get("sql")
                        if sql:
                            break
                        
                if query:
                    db_names = [catalogs_map.get(cid, "Unknown") for cid in user_msg.chat.catalog_ids] if user_msg.chat.catalog_ids else ["All Databases"]
                    database_str = ", ".join(db_names)
                    
                    history_list.append({
                        "id": str(user_msg.id),
                        "chat_id": chat_id,
                        "date": user_msg.created_at.isoformat(),
                        "query": query,
                        "sql": sql,
                        "export_url": asst_msg.export_url,
                        "user_email": user_msg.chat.user.email if hasattr(user_msg, 'chat') and hasattr(user_msg.chat, 'user') else None,
                        "database": database_str
                    })

    # Sort history_list descending by date
    history_list.sort(key=lambda x: x["date"], reverse=True)

    # Format usage_history for frontend charts
    usage_history = []
    today = datetime.utcnow().date()
    for i in range(29, -1, -1):
        d = today - timedelta(days=i)
        d_str = d.strftime("%Y-%m-%d")
        usage_history.append({
            "date": d_str,
            "requests": usage_by_date.get(d_str, {}).get("requests", 0),
            "tokens": usage_by_date.get(d_str, {}).get("tokens", 0)
        })

    return {
        "total_chats": total_chats,
        "total_requests": total_requests,
        "total_tokens": total_tokens,
        "usage_history": usage_history,
        "history_list": history_list
    }
