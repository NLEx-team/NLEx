from fastapi import FastAPI
from src.routers.auth import router as auth_router
from src.routers.users import router as users_router
from src.middleware.auth import AuthMiddleware
from src.database.session import engine, Base
from rich.traceback import install

# Enable user-friendly tracebacks
install(show_locals=True)

# Ensure models are imported so SQLAlchemy knows about them
from src.database.models import user 

# Create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="NLEx", version="1.0.0")

app.add_middleware(AuthMiddleware)
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(users_router, prefix="/users", tags=["users"])

@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "NLEx"}
