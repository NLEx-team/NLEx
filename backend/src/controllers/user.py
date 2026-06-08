from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Union

from src.services.users import UserService
from src.database.models.user import User
from src.models.schemas.user import UserUpdate, UserAdminUpdate

class UserController:
    @staticmethod
    async def get_user_by_id(db: AsyncSession, id: UUID) -> User:
        user_service = UserService(db)
        user = await user_service.get_user(id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="User not found"
            )
        return user

    @staticmethod
    async def get_users(db: AsyncSession) -> List[User]:
        user_service = UserService(db)
        return await user_service.list_users()

    @staticmethod
    async def update_user(db: AsyncSession, id: UUID, user_update: Union[UserUpdate, UserAdminUpdate]) -> User:
        user_service = UserService(db)
        updated_user = await user_service.update_user(id, user_update)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="User not found"
            )
        return updated_user

    @staticmethod
    async def delete_me(db: AsyncSession, current_user: User) -> None:
        user_service = UserService(db)
        success = await user_service.delete_user(current_user.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="User not found"
            )

    @staticmethod
    async def delete_user(db: AsyncSession, id: UUID) -> None:
        user_service = UserService(db)
        success = await user_service.delete_user(id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="User not found"
            )
