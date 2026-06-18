from contextlib import asynccontextmanager
from fastapi import FastAPI
from src.routers.auth import router as auth_router
from src.routers.users import router as users_router
from src.routers.chats import router as chats_router
from src.routers.catalogs import router as catalogs_router
from src.middleware.auth import AuthMiddleware
from src.database.session import engine, Base
from rich.traceback import install

# Enable user-friendly tracebacks
install(show_locals=True)

# Ensure models are imported so SQLAlchemy knows about them
from src.database.models import user
from src.database.models import connection
from src.database.models import chat 
from src.database.models import User, UserProfile, Catalog, UserRole
from src.repositories.user_repo import UserRepository
from src.services.auth import AuthService
from src.utils.config import settings

async def create_default_admin():
    """
    Checks if any admin exists. If not, creates one from environment variables.
    """
    async with engine.begin() as conn:
        # We need a session to use the repository
        from src.database.session import AsyncSessionLocal
        async with AsyncSessionLocal() as session:
            user_repo = UserRepository(session)
            
            # Check if any admin exists
            from sqlalchemy import select
            stmt = select(User).where(User.role == UserRole.ADMIN)
            result = await session.execute(stmt)
            admin = result.scalars().first()
            
            if not admin:
                print(f"No admin found. Creating default admin: {settings.ADMIN_EMAIL}")
                hashed_password = AuthService.get_password_hash(settings.ADMIN_PASSWORD)
                db_admin = User(
                    email=settings.ADMIN_EMAIL,
                    hashed_password=hashed_password,
                    role=UserRole.ADMIN
                )
                db_admin.profile = UserProfile(
                    first_name="Default",
                    last_name="Admin"
                )
                await user_repo.create(db_admin)
                print("Default admin created successfully.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create default admin if missing
    await create_default_admin()
    
    yield
    # Clean up on shutdown if needed

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="NLEx", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://nlex.tech",
        "https://www.nlex.tech",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(AuthMiddleware)
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(chats_router, prefix="/chats", tags=["chats"])
app.include_router(catalogs_router, prefix="/catalogs", tags=["catalogs"])

@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "NLEx"}
