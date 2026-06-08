from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.session import get_db
from src.models.api.auth import LoginResponse, RegisterResponse, LoginRequest, RegisterRequest
from src.controllers.auth import AuthController

router = APIRouter()

@router.post("/register", response_model=RegisterResponse)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    return await AuthController.register(db, data)

@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await AuthController.login(db, data)
