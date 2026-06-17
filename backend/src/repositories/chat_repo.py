from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from datetime import datetime

from src.database.models.chat import Chat, Draft

class ChatRepository:
    @staticmethod
    async def create_chat(db: AsyncSession, chat: Chat) -> Chat:
        db.add(chat)
        await db.commit()
        await db.refresh(chat)
        return chat

    @staticmethod
    async def get_chat_by_id_and_user(db: AsyncSession, chat_id: UUID, user_id: UUID) -> Optional[Chat]:
        result = await db.execute(select(Chat).where(Chat.id == chat_id, Chat.user_id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_chat_by_id(db: AsyncSession, chat_id: UUID) -> Optional[Chat]:
        result = await db.execute(select(Chat).where(Chat.id == chat_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def update_chat(db: AsyncSession, chat: Chat) -> Chat:
        chat.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(chat)
        return chat

    @staticmethod
    async def delete_chat(db: AsyncSession, chat: Chat) -> None:
        await db.delete(chat)
        await db.commit()

    @staticmethod
    async def create_draft(db: AsyncSession, draft: Draft) -> Draft:
        db.add(draft)
        await db.commit()
        await db.refresh(draft)
        return draft

    @staticmethod
    async def get_latest_draft(db: AsyncSession, chat_id: UUID, user_id: UUID) -> Optional[Draft]:
        result = await db.execute(
            select(Draft)
            .join(Chat)
            .where(Draft.chat_id == chat_id, Chat.user_id == user_id)
            .order_by(Draft.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def update_draft(db: AsyncSession, draft: Draft) -> Draft:
        await db.commit()
        await db.refresh(draft)
        return draft
