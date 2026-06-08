from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, update, delete
from src.database.models.user import User, UserProfile
from src.models.schemas.user import UserProfileBase
from uuid import UUID
from typing import List, Optional, Any, Dict

class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        stmt = select(User).options(selectinload(User.profile)).where(User.id == user_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_user_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).options(selectinload(User.profile)).where(User.email == email)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def list_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        stmt = select(User).options(selectinload(User.profile)).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def create(self, db_obj: User) -> User:
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def update_user_fields(self, user_id: UUID, update_data: Dict[str, Any]) -> Optional[User]:
        db_user = await self.get_user_by_id(user_id)
        if not db_user:
            return None
        
        for key, value in update_data.items():
            if hasattr(db_user, key):
                setattr(db_user, key, value)
        
        await self.db.commit()
        await self.db.refresh(db_user)
        return db_user

    async def update_user_profile(self, user_id: UUID, profile_update: UserProfileBase) -> Optional[UserProfile]:
        stmt = select(UserProfile).where(UserProfile.user_id == user_id)
        result = await self.db.execute(stmt)
        db_profile = result.scalars().first()
        
        if not db_profile:
            return None
        
        update_data = profile_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if hasattr(db_profile, key):
                setattr(db_profile, key, value)
        
        await self.db.commit()
        await self.db.refresh(db_profile)
        return db_profile

    async def delete_user(self, user_id: UUID) -> bool:
        db_user = await self.get_user_by_id(user_id)
        if not db_user:
            return False
        
        await self.db.delete(db_user)
        await self.db.commit()
        return True
