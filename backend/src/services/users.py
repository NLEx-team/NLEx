from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional, Union
from fastapi import HTTPException, status

from src.repositories.user_repo import UserRepository
from src.models.schemas.user import UserCreate, UserUpdate, UserAdminUpdate, UserProfileBase, UserProfileCreate
from src.database.models.user import User, UserProfile

class UserService:
    def __init__(self, db: Session):
        self.repository = UserRepository(db)

    def create_user(self, user_in: UserCreate, hashed_password: str) -> User:
        db_user = User(
            email=user_in.email,
            hashed_password=hashed_password,
            role=user_in.role
        )
        profile_in = user_in.profile or UserProfileCreate()
        db_profile = UserProfile(**profile_in.model_dump())
        db_user.profile = db_profile
        return self.repository.create(db_user)

    def get_user(self, user_id: UUID) -> Optional[User]:
        return self.repository.get_user_by_id(user_id)

    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.repository.get_user_by_email(email)

    def list_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        return self.repository.list_users(skip=skip, limit=limit)

    def update_user(self, user_id: UUID, user_update: Union[UserUpdate, UserAdminUpdate]) -> Optional[User]:
        # 1. Email Uniqueness Check
        if user_update.email:
            existing_user = self.get_user_by_email(user_update.email)
            if existing_user and existing_user.id != user_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")
        
        # 2. Extract and Update Profile fields
        profile_fields = {"first_name", "last_name", "avatar_url"}
        update_dict = user_update.model_dump(exclude_unset=True)
        
        profile_update_data = {k: v for k, v in update_dict.items() if k in profile_fields}
        if profile_update_data:
            self.repository.update_user_profile(user_id, UserProfileBase(**profile_update_data))
            
        # 3. Update User fields (email, role if admin update)
        # Note: We create a temporary schema to pass only User fields to the repository
        user_fields = {"email", "role"}
        user_update_data = {k: v for k, v in update_dict.items() if k in user_fields}
        
        # If there are user fields to update, we perform the update. 
        # Even if empty, we return the refreshed user.
        return self.repository.update_user_fields(user_id, user_update_data)

    def delete_user(self, user_id: UUID) -> bool:
        return self.repository.delete_user(user_id)
