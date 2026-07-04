from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Dict, Optional
from datetime import datetime, timedelta, date, time
from uuid import UUID

from src.database.session import get_db
from src.database.models.user import User, UserRole
from src.database.models.chat import Chat, ChatMessage
from src.database.models.catalog import Catalog
from src.dependencies.auth import get_current_user

router = APIRouter()

# Cap the history payload so a huge dataset can't blow up the response.
MAX_HISTORY_ROWS = 500
# Cap the number of chart buckets (days) for very wide ranges.
MAX_CHART_DAYS = 180


def _parse_date(s: Optional[str]) -> Optional[date]:
    if not s:
        return None
    try:
        return datetime.strptime(s[:10], "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None


@router.get("/")
async def get_user_analytics(
    scope: Optional[str] = None,
    start_date: Optional[str] = Query(None, description="Inclusive start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Inclusive end date YYYY-MM-DD"),
    user_id: Optional[str] = Query(None, description="Filter by a specific user (admin + global only)"),
    catalog_ids: Optional[str] = Query(None, description="Comma-separated database ids to filter by"),
    match_mode: Optional[str] = Query("any", description="'any' = overlap, 'exact' = the request's DB set must equal the selection"),
    search: Optional[str] = Query(None, description="Case-insensitive search within the query text"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    is_global = scope == "global" and user.role == UserRole.ADMIN

    start = _parse_date(start_date)
    end = _parse_date(end_date)
    if start and end and end < start:
        start, end = end, start  # be forgiving about swapped dates

    # Resolve the user scope: personal is always self; global admins may target a user.
    target_user_id: Optional[UUID] = None
    if is_global:
        if user_id:
            try:
                target_user_id = UUID(user_id)
            except ValueError:
                target_user_id = None
    else:
        target_user_id = user.id

    # Database filter + match mode.
    #   any   -> keep requests that use AT LEAST ONE of the selected databases.
    #   exact -> keep requests whose database set EXACTLY equals the selection.
    selected_catalogs = None
    if catalog_ids:
        selected_catalogs = {c.strip() for c in catalog_ids.split(",") if c.strip()} or None
    exact = match_mode == "exact"

    # Catalog id -> name map (for display and the checkbox list).
    catalog_result = await db.execute(select(Catalog.id, Catalog.name))
    catalogs_rows = catalog_result.all()
    catalogs_map = {str(row.id): row.name for row in catalogs_rows}

    def _in_range_dt(column):
        conds = []
        if start is not None:
            conds.append(column >= datetime.combine(start, time.min))
        if end is not None:
            conds.append(column < datetime.combine(end + timedelta(days=1), time.min))
        return conds

    all_catalog_ids = set(catalogs_map.keys())

    def _matches(cids) -> bool:
        # An empty catalog set means the chat queried across ALL databases, so
        # normalise it to the full set. This makes "All Databases" match both
        # explicit full-set requests and the implicit all-DB ("All Databases") ones.
        s = set(str(c) for c in (cids or [])) or set(all_catalog_ids)
        if exact:
            return s == selected_catalogs
        return bool(s & selected_catalogs)

    # --- Messages query (SQL-level filters: scope/user + date range) ---
    stmt = (
        select(ChatMessage)
        .join(Chat, ChatMessage.chat_id == Chat.id)
        .options(selectinload(ChatMessage.chat).selectinload(Chat.user))
        .order_by(ChatMessage.created_at.desc())
    )
    if target_user_id is not None:
        stmt = stmt.where(Chat.user_id == target_user_id)
    for cond in _in_range_dt(ChatMessage.created_at):
        stmt = stmt.where(cond)

    messages = (await db.execute(stmt)).scalars().all()

    # --- Chats query (scope/user + date range) for the chat count ---
    chat_stmt = select(Chat)
    if target_user_id is not None:
        chat_stmt = chat_stmt.where(Chat.user_id == target_user_id)
    for cond in _in_range_dt(Chat.created_at):
        chat_stmt = chat_stmt.where(cond)
    chats = (await db.execute(chat_stmt)).scalars().all()

    # --- Apply the database filter (any / exact) ---
    if selected_catalogs:
        messages = [m for m in messages if m.chat and _matches(m.chat.catalog_ids)]
        chats = [c for c in chats if _matches(c.catalog_ids)]

    total_chats = len(chats)

    # --- Totals + per-day usage (from the filtered messages) ---
    total_requests = 0
    total_tokens = 0
    usage_by_date: Dict[str, Dict[str, int]] = {}

    for m in messages:
        date_str = m.created_at.strftime("%Y-%m-%d")
        bucket = usage_by_date.setdefault(date_str, {"requests": 0, "tokens": 0})
        if m.role == "user":
            total_requests += 1
            bucket["requests"] += 1
        elif m.role == "assistant" and m.total_tokens:
            total_tokens += m.total_tokens
            bucket["tokens"] += m.total_tokens

    # --- History list: user -> assistant pairs, then optional text search ---
    chats_msgs: Dict[str, List[ChatMessage]] = {}
    for m in messages:
        chats_msgs.setdefault(str(m.chat_id), []).append(m)

    search_lower = search.strip().lower() if search and search.strip() else None
    history_list = []
    for chat_id, msgs in chats_msgs.items():
        msgs.sort(key=lambda x: x.created_at)
        for i in range(len(msgs) - 1):
            if msgs[i].role != "user" or msgs[i + 1].role != "assistant":
                continue
            user_msg = msgs[i]
            asst_msg = msgs[i + 1]

            query = ""
            for b in user_msg.blocks:
                if b.get("type") == "text":
                    query += b.get("text", "")
            if not query:
                continue
            if search_lower and search_lower not in query.lower():
                continue

            sql = None
            for b in asst_msg.blocks:
                if b.get("sql"):
                    sql = b.get("sql")
                    break

            if user_msg.chat and user_msg.chat.catalog_ids:
                db_names = sorted(catalogs_map.get(cid, "Unknown") for cid in user_msg.chat.catalog_ids)
            else:
                db_names = ["All Databases"]

            history_list.append({
                "id": str(user_msg.id),
                "chat_id": chat_id,
                "date": user_msg.created_at.isoformat(),
                "query": query,
                "sql": sql,
                "export_url": asst_msg.export_url,
                "user_email": user_msg.chat.user.email if user_msg.chat and user_msg.chat.user else None,
                "database": ", ".join(db_names),
            })

    history_list.sort(key=lambda x: x["date"], reverse=True)
    history_list = history_list[:MAX_HISTORY_ROWS]

    # --- Chart buckets ---
    # An explicit range shows EXACTLY that range (e.g. "last 7 days" => 7 bars,
    # nothing before it). With no range ("all time") span from the earliest
    # activity to today so nothing is hidden.
    if start and end:
        range_start, range_end = start, end
    else:
        range_end = datetime.utcnow().date()
        parsed = [d for d in (_parse_date(k) for k in usage_by_date.keys()) if d]
        range_start = min(parsed) if parsed else (range_end - timedelta(days=29))
    if range_start > range_end:
        range_start = range_end
    if (range_end - range_start).days > MAX_CHART_DAYS:
        range_start = range_end - timedelta(days=MAX_CHART_DAYS)

    usage_history = []
    d = range_start
    while d <= range_end:
        d_str = d.strftime("%Y-%m-%d")
        usage_history.append({
            "date": d_str,
            "requests": usage_by_date.get(d_str, {}).get("requests", 0),
            "tokens": usage_by_date.get(d_str, {}).get("tokens", 0),
        })
        d += timedelta(days=1)

    # --- Filter option lists for the UI ---
    available_catalogs = [{"id": str(row.id), "name": row.name} for row in catalogs_rows]
    available_users = []
    if is_global:
        users_res = await db.execute(select(User.id, User.email).order_by(User.email))
        available_users = [{"id": str(row.id), "email": row.email} for row in users_res.all()]

    return {
        "total_chats": total_chats,
        "total_requests": total_requests,
        "total_tokens": total_tokens,
        "usage_history": usage_history,
        "history_list": history_list,
        "available_users": available_users,
        "available_catalogs": available_catalogs,
    }
