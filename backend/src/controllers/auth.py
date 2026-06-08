from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from src.services.users import UserService
from src.services.auth import AuthService
from src.models.api.auth import LoginResponse, RegisterResponse, LoginRequest, RegisterRequest
from src.models.schemas.user import UserCreate, UserProfileCreate

class AuthController:
    @staticmethod
    async def register(db: AsyncSession, data: RegisterRequest) -> RegisterResponse:
        user_service = UserService(db)
        auth_service = AuthService()

        if await user_service.get_user_by_email(data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )

        profile_in = UserProfileCreate(
            first_name=data.first_name,
            last_name=data.last_name,
            avatar_url=str(data.avatar) if data.avatar else None
        )
        
        user_in = UserCreate(
            email=data.email,
            password=data.password,
            profile=profile_in
        )
        
        hashed_password = auth_service.get_password_hash(data.password)
        user = await user_service.create_user(user_in, hashed_password)
        
        return RegisterResponse(user=user)

    @staticmethod
    async def login(db: AsyncSession, data: LoginRequest) -> LoginResponse:
        user_service = UserService(db)
        auth_service = AuthService()

        user = await user_service.get_user_by_email(data.email)
        if not user or not auth_service.verify_password(data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )

        access_token = auth_service.create_access_token(data={"sub": str(user.id)})
        
        return LoginResponse(
            jwt_token=access_token,
            user=user
        )
