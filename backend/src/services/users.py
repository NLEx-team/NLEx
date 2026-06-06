from src.repositories.user_repo import UserRepository
from src.models.schemas.user import UserCreate, UserUpdate, UserProfileBase, UserProfileCreate
from src.database.models.user import User, UserProfile
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

class UserService:
    def __init__(self, db: Session):
        self.repository = UserRepository(db)

    def create_user(self, user_in: UserCreate, hashed_password: str) -> User:
        # Create user instance
        db_user = User(
            email=user_in.email,
            hashed_password=hashed_password,
            is_admin=user_in.is_admin
        )
        
        # Prepare profile (use provided or default blank)
        profile_in = user_in.profile or UserProfileCreate()
        db_profile = UserProfile(
            **profile_in.model_dump()
        )
        
        # Link them
        db_user.profile = db_profile
        
        # Save both (cascade delete-orphan and uselist=False in model handles one-to-one)
        return self.repository.create(db_user)

    def get_user(self, user_id: UUID) -> Optional[User]:
        return self.repository.get_user_by_id(user_id)

    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.repository.get_user_by_email(email)

    def list_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        return self.repository.list_users(skip=skip, limit=limit)

    def update_user(self, user_id: UUID, user_update: UserUpdate) -> Optional[User]:
        return self.repository.update_user(user_id, user_update)

    def update_profile(self, user_id: UUID, profile_update: UserProfileBase) -> Optional[UserProfile]:
        return self.repository.update_user_profile(user_id, profile_update)

    def delete_user(self, user_id: UUID) -> bool:
        return self.repository.delete_user(user_id)
