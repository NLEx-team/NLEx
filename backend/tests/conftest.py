import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.database.session import Base, engine, get_db, SessionLocal
from src.database.models.user import User, UserProfile

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """
    Creates tables once per test session.
    """
    Base.metadata.create_all(bind=engine)
    yield
    # Optional: Drop tables after session
    # Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """
    Provides a fresh session for each test and wipes data after.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Clean up data after each test to ensure isolation
        # We delete in reverse order of dependencies
        with engine.connect() as conn:
            conn.execute(Base.metadata.tables["user_profiles"].delete())
            conn.execute(Base.metadata.tables["users"].delete())
            conn.commit()

@pytest.fixture(scope="function")
def client(db_session):
    """
    FastAPI TestClient that uses the real database session.
    """
    with TestClient(app) as c:
        yield c
