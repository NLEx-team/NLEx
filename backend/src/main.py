from contextlib import asynccontextmanager
from fastapi import FastAPI
from src.routers.auth import router as auth_router
from src.routers.users import router as users_router
from src.routers.chats import router as chats_router
from src.routers.catalogs import router as catalogs_router
from src.routers.analytics import router as analytics_router
from src.routers.admin import router as admin_router
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
            
            hashed_password = AuthService.get_password_hash(settings.ADMIN_PASSWORD)
            
            if not admin:
                print(f"No admin found. Creating default admin: {settings.ADMIN_EMAIL}")
                db_admin = User(
                    email=settings.ADMIN_EMAIL,
                    hashed_password=hashed_password,
                    role=UserRole.ADMIN
                )
                db_admin.profile = UserProfile(
                    first_name="Default",
                    last_name="Admin"
                )
                session.add(db_admin)
            else:
                # Update existing admin to match config
                admin.email = settings.ADMIN_EMAIL
                admin.hashed_password = hashed_password
                
            await session.commit()
            print("Default admin verified/created successfully.")

async def sync_catalogs_on_startup():
    """
    Synchronizes all existing catalogs from the database to Trino on startup.
    This ensures Trino knows about dynamic catalogs even after container restart.
    """
    async with engine.begin() as conn:
        from src.database.session import AsyncSessionLocal
        from src.repositories.catalog_repo import CatalogRepository
        from src.services.catalog_service import CatalogService
        from src.services.distributed_db import DistributedDatabaseService
        
        async with AsyncSessionLocal() as session:
            repo = CatalogRepository(session)
            db_service = DistributedDatabaseService(
                host="trino", # Should be settings.TRINO_HOST if exists, but we'll use "trino" to match catalogs router
                port=settings.TRINO_PORT,
                user="trino"
            )
            catalog_service = CatalogService(repo, db_service)
            
            catalogs = await catalog_service.list_catalogs()
            for catalog in catalogs:
                print(f"Syncing catalog '{catalog.name}' to Trino...")
                await catalog_service.sync_catalog(catalog.id)
            print("Catalog synchronization complete.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create default admin if missing
    await create_default_admin()
    
    # Sync catalogs to Trino
    try:
        await sync_catalogs_on_startup()
    except Exception as e:
        print(f"Failed to sync catalogs on startup: {e}")
    
    yield
    # Clean up on shutdown if needed

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="NLEx", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://nlex.tech",
        "https://www.nlex.tech",
        "http://nlex.tech",
        "http://www.nlex.tech",
        "http://194.226.97.77",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174"
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
app.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
app.include_router(admin_router, prefix="", tags=["admin"])

@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "NLEx"}
