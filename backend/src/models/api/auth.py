from pydantic import BaseModel, EmailStr, Field, HttpUrl
from typing import Optional

from src.models.schemas.user import UserRead

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(
        min_length=8,
        max_length=128,
    )
    first_name: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=128,
    )
    last_name: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=128,
    )
    avatar: HttpUrl = Field(
        default=None
    )

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(
        min_length=8,
        max_length=128,
    )

class RegisterResponse(BaseModel):
    user: UserRead

class LoginResponse(BaseModel):
    jwt_token: str
    user: UserRead