from sqlalchemy.orm import Session
from src.database.models.user import User, UserProfile
from src.models.schemas.user import UserUpdate, UserProfileBase
from uuid import UUID
from typing import List, Optional

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def list_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        return self.db.query(User).offset(skip).limit(limit).all()

    def create(self, db_obj: User) -> User:
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update_user(self, user_id: UUID, user_update: UserUpdate) -> Optional[User]:
        db_user = self.get_user_by_id(user_id)
        if not db_user:
            return None
        
        update_data = user_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_user, key, value)
        
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def update_user_profile(self, user_id: UUID, profile_update: UserProfileBase) -> Optional[UserProfile]:
        db_profile = self.db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        if not db_profile:
            return None
        
        update_data = profile_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_profile, key, value)
        
        self.db.commit()
        self.db.refresh(db_profile)
        return db_profile

    def delete_user(self, user_id: UUID) -> bool:
        db_user = self.get_user_by_id(user_id)
        if not db_user:
            return False
        
        self.db.delete(db_user)
        self.db.commit()
        return True
