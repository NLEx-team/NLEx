from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import func
from uuid import UUID
from datetime import datetime

from src.database.models.chat import Chat, Draft, ChatMessage
from src.database.models.chat_folder import ChatFolder

class ChatRepository:
    @staticmethod
    async def create_chat(db: AsyncSession, chat: Chat) -> Chat:
        db.add(chat)
        await db.commit()
        await db.refresh(chat)
        return chat

    @staticmethod
    async def get_chat_by_id_and_user(db: AsyncSession, chat_id: UUID, user_id: UUID) -> Optional[Chat]:
        result = await db.execute(select(Chat).where(Chat.id == chat_id, Chat.user_id == user_id, Chat.is_deleted == False))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_chat_by_id(db: AsyncSession, chat_id: UUID) -> Optional[Chat]:
        result = await db.execute(select(Chat).where(Chat.id == chat_id, Chat.is_deleted == False))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_chats(db: AsyncSession, user_id: UUID, skip: int = 0, limit: int = 100) -> List[Chat]:
        stmt = (
            select(Chat)
            .where(Chat.user_id == user_id, Chat.is_deleted == False)
            .order_by(desc(Chat.updated_at))
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def update_chat(db: AsyncSession, chat: Chat) -> Chat:
        chat.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(chat)
        return chat

    @staticmethod
    async def update_chat_title(db: AsyncSession, chat_id: UUID, title: str) -> Optional[Chat]:
        result = await db.execute(select(Chat).where(Chat.id == chat_id, Chat.is_deleted == False))
        chat = result.scalar_one_or_none()
        if not chat:
            return None
        chat.title = title
        chat.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(chat)
        return chat

    @staticmethod
    async def delete_chat(db: AsyncSession, chat: Chat) -> None:
        chat.is_deleted = True
        chat.updated_at = datetime.utcnow()
        await db.commit()

    @staticmethod
    async def add_message(db: AsyncSession, chat_id: UUID, role: str, blocks: list, export_url: Optional[str] = None, export_filename: Optional[str] = None, total_tokens: Optional[int] = None) -> ChatMessage:
        message = ChatMessage(
            chat_id=chat_id,
            role=role,
            blocks=blocks,
            export_url=export_url,
            export_filename=export_filename,
            total_tokens=total_tokens,
        )
        db.add(message)
        # Touch the chat's updated_at
        result = await db.execute(select(Chat).where(Chat.id == chat_id))
        chat = result.scalar_one_or_none()
        if chat:
            chat.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(message)
        return message

    @staticmethod
    async def get_messages(db: AsyncSession, chat_id: UUID, skip: int = 0, limit: int = 500) -> List[ChatMessage]:
        stmt = (
            select(ChatMessage)
            .where(ChatMessage.chat_id == chat_id)
            .order_by(ChatMessage.created_at)
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

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

    # ---- Folder methods ----

    @staticmethod
    async def create_folder(db: AsyncSession, user_id: UUID, name: str) -> ChatFolder:
        folder = ChatFolder(user_id=user_id, name=name)
        db.add(folder)
        await db.commit()
        await db.refresh(folder)
        return folder

    @staticmethod
    async def get_user_folders(db: AsyncSession, user_id: UUID) -> List[ChatFolder]:
        stmt = (
            select(ChatFolder)
            .where(ChatFolder.user_id == user_id)
            .order_by(ChatFolder.created_at)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_folder_by_id(db: AsyncSession, folder_id: UUID, user_id: UUID) -> Optional[ChatFolder]:
        stmt = select(ChatFolder).where(ChatFolder.id == folder_id, ChatFolder.user_id == user_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def delete_folder(db: AsyncSession, folder: ChatFolder, delete_chats: bool = False) -> None:
        if delete_chats:
            stmt = select(Chat).where(Chat.folder_id == folder.id, Chat.is_deleted == False)
            result = await db.execute(stmt)
            chats = list(result.scalars().all())
            for chat in chats:
                chat.is_deleted = True
                chat.folder_id = None
                chat.updated_at = datetime.utcnow()
        else:
            stmt = select(Chat).where(Chat.folder_id == folder.id)
            result = await db.execute(stmt)
            chats = list(result.scalars().all())
            for chat in chats:
                chat.folder_id = None

        await db.delete(folder)
        await db.commit()

    @staticmethod
    async def update_folder(db: AsyncSession, folder: ChatFolder, name: str) -> ChatFolder:
        folder.name = name
        folder.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(folder)
        return folder

    @staticmethod
    async def move_chat_to_folder(db: AsyncSession, chat: Chat, folder_id: UUID) -> Chat:
        chat.folder_id = folder_id
        chat.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(chat)
        return chat

    @staticmethod
    async def remove_chat_from_folder(db: AsyncSession, chat: Chat) -> Chat:
        chat.folder_id = None
        chat.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(chat)
        return chat

    @staticmethod
    async def get_chats_in_folder(db: AsyncSession, folder_id: UUID) -> List[Chat]:
        stmt = (
            select(Chat)
            .where(Chat.folder_id == folder_id, Chat.is_deleted == False)
            .order_by(desc(Chat.updated_at))
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def count_chats_in_folder(db: AsyncSession, folder_id: UUID) -> int:
        stmt = select(func.count(Chat.id)).where(
            Chat.folder_id == folder_id, Chat.is_deleted == False
        )
        result = await db.execute(stmt)
        return result.scalar() or 0
