from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional, Union
from fastapi import HTTPException, status

from src.repositories.user_repo import UserRepository
from src.models.schemas.user import UserCreate, UserUpdate, UserAdminUpdate, UserProfileBase, UserProfileCreate
from src.database.models.user import User, UserProfile

class UserService:
    def __init__(self, db: AsyncSession):
        self.repository = UserRepository(db)

    async def create_user(self, user_in: UserCreate, hashed_password: str) -> User:
        db_user = User(
            email=user_in.email,
            hashed_password=hashed_password,
            role=user_in.role
        )
        profile_in = user_in.profile or UserProfileCreate()
        db_profile = UserProfile(**profile_in.model_dump())
        db_user.profile = db_profile
        return await self.repository.create(db_user)

    async def get_user(self, user_id: UUID) -> Optional[User]:
        return await self.repository.get_user_by_id(user_id)

    async def get_user_by_email(self, email: str) -> Optional[User]:
        return await self.repository.get_user_by_email(email)

    async def list_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        return await self.repository.list_users(skip=skip, limit=limit)

    async def update_user(self, user_id: UUID, user_update: Union[UserUpdate, UserAdminUpdate]) -> Optional[User]:
        # 1. Email Uniqueness Check
        if user_update.email:
            existing_user = await self.get_user_by_email(user_update.email)
            if existing_user and existing_user.id != user_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")
        
        # 2. Extract and Update Profile fields
        profile_fields = {"first_name", "last_name", "avatar_url", "language"}
        update_dict = user_update.model_dump(exclude_unset=True)
        
        profile_update_data = {k: v for k, v in update_dict.items() if k in profile_fields}
        if profile_update_data:
            await self.repository.update_user_profile(user_id, UserProfileBase(**profile_update_data))
            
        # 3. Update User fields (email, role, is_blocked if admin update)
        user_fields = {"email", "role", "is_blocked"}
        user_update_data = {k: v for k, v in update_dict.items() if k in user_fields}
        
        return await self.repository.update_user_fields(user_id, user_update_data)

    async def delete_user(self, user_id: UUID) -> bool:
        return await self.repository.delete_user(user_id)
