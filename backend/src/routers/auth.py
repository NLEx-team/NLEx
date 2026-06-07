from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.database.session import get_db
from src.models.api.auth import LoginResponse, RegisterResponse, LoginRequest, RegisterRequest
from src.controllers.auth import AuthController

router = APIRouter()

@router.post("/register", response_model=RegisterResponse)
async def register(data: RegisterRequest, db: Session = Depends(get_db)):
    return await AuthController.register(db, data)

@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest, db: Session = Depends(get_db)):
    return await AuthController.login(db, data)
