from contextlib import asynccontextmanager
from fastapi import FastAPI
from src.routers.auth import router as auth_router
from src.routers.users import router as users_router
from src.routers.chats import router as chats_router
from src.routers.connections import router as connections_router
from src.middleware.auth import AuthMiddleware
from src.database.session import engine, Base
from rich.traceback import install

# Enable user-friendly tracebacks
install(show_locals=True)

# Ensure models are imported so SQLAlchemy knows about them
from src.database.models import user 

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Clean up on shutdown if needed

app = FastAPI(title="NLEx", version="1.0.0", lifespan=lifespan)

app.add_middleware(AuthMiddleware)
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(chats_router, prefix="/chats", tags=["chats"])
app.include_router(connections_router, prefix="/connections", tags=["connections"])

@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "NLEx"}
