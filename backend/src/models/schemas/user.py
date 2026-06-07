from pydantic import BaseModel, EmailStr, HttpUrl, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    VISITOR = "visitor"

class UserProfileBase(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar_url: Optional[str] = None

class UserProfileCreate(UserProfileBase):
    pass

class UserProfileRead(UserProfileBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    updated_at: datetime

class UserBase(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.VISITOR

class UserCreate(UserBase):
    password: str
    profile: Optional[UserProfileCreate] = None

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None

class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
    profile: Optional[UserProfileRead] = None
