from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Union

from src.services.users import UserService
from src.database.models.user import User
from src.models.schemas.user import UserUpdate, UserAdminUpdate

class UserController:
    @staticmethod
    async def get_user_by_id(db: Session, id: UUID) -> User:
        user_service = UserService(db)
        user = user_service.get_user(id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="User not found"
            )
        return user

    @staticmethod
    async def get_users(db: Session) -> List[User]:
        user_service = UserService(db)
        return user_service.list_users()

    @staticmethod
    async def update_user(db: Session, id: UUID, user_update: Union[UserUpdate, UserAdminUpdate]) -> User:
        user_service = UserService(db)
        updated_user = user_service.update_user(id, user_update)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="User not found"
            )
        return updated_user

    @staticmethod
    async def delete_me(db: Session, current_user: User) -> None:
        user_service = UserService(db)
        success = user_service.delete_user(current_user.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="User not found"
            )

    @staticmethod
    async def delete_user(db: Session, id: UUID) -> None:
        user_service = UserService(db)
        success = user_service.delete_user(id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="User not found"
            )
