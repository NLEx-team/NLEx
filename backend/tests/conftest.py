import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from src.main import app
from src.database.session import Base, engine, get_db, AsyncSessionLocal
from src.database.models.user import User, UserProfile
from sqlalchemy import delete

# Configure pytest-asyncio to use the default event loop
@pytest.fixture(scope="session")
def event_loop():
    import asyncio
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_db():
    """
    Creates tables once per test session.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Optional: Drop tables after session
    # async with engine.begin() as conn:
    #     await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture(scope="function")
async def db_session():
    """
    Provides a fresh session for each test and wipes data after.
    """
    async with AsyncSessionLocal() as session:
        yield session
        # Clean up data after each test to ensure isolation
        # We delete in reverse order of dependencies
        await session.execute(delete(UserProfile))
        await session.execute(delete(User))
        await session.commit()

@pytest_asyncio.fixture(scope="function")
async def client(db_session):
    """
    FastAPI AsyncClient that uses the real database session.
    """
    # Overriding get_db to return our test session
    async def _get_test_db():
        yield db_session
    
    app.dependency_overrides[get_db] = _get_test_db
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


# --- Integration test auto-marking -------------------------------------------
# These modules require live external services (Trino, real target databases,
# or the LLM API) and are excluded from the fast PR CI via `-m "not integration"`.
# The full suite still runs them (e.g. via the docker-compose `test` profile).
import pathlib

_INTEGRATION_MODULES = {
    "test_distributed_db",
    "test_distributed_db_catalogs",
    "test_distributed_db_integration",
    "test_llm_service",
    "test_orchestrator_integration",
    "test_qa_automation",
    "test_relationship_inference_real_db",
    "test_schema_service",
    "test_schema_service_using_real_db",
}


def pytest_collection_modifyitems(config, items):
    for item in items:
        module_stem = pathlib.Path(str(item.fspath)).stem
        if module_stem in _INTEGRATION_MODULES:
            item.add_marker(pytest.mark.integration)
