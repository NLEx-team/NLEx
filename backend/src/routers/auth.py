from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.session import get_db
from src.models.api.auth import LoginResponse, RegisterResponse, LoginRequest, RegisterRequest
from src.controllers.auth import AuthController
from src.utils.config import get_settings

router = APIRouter()
settings = get_settings()

@router.post("/register", response_model=RegisterResponse)
async def register(data: RegisterRequest, response: Response, db: AsyncSession = Depends(get_db)):
    result = await AuthController.register(db, data)
    # Automatically log in the user after register, if we want (wait, register doesn't return token right now)
    return result

@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    result = await AuthController.login(db, data)
    response.set_cookie(
        key="access_token",
        value=result.jwt_token,
        httponly=True,
        samesite="lax",
        secure=settings.ENVIRONMENT == "production",
        max_age=1440 * 60, # 24 hours in seconds
    )
    return result
