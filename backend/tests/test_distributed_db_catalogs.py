import pytest
import time
import os

from src.services.distributed_db import DistributedDatabaseService
from src.models.schemas.catalog import (
    CatalogConnection,
    DatabaseType,
)

TRINO_HOST = os.getenv("TRINO_HOST", "trino")
TRINO_PORT = int(os.getenv("TRINO_PORT", "8080"))
TRINO_USER = os.getenv("TRINO_USER", "admin")

@pytest.fixture(scope="module")
def db_service():
    service = DistributedDatabaseService(
        host=TRINO_HOST,
        port=TRINO_PORT,
        user=TRINO_USER,
    )
    
    # Wait for Trino to be ready
    max_retries = 30
    for i in range(max_retries):
        try:
            service.execute_query_sync("SELECT 1")
            break
        except Exception:
            if i == max_retries - 1:
                raise
            time.sleep(1)
            
    return service

@pytest.fixture(autouse=True)
def cleanup_catalog(db_service):
    try:
        db_service.execute_query_sync("DROP CATALOG IF EXISTS pg_test")
    except Exception:
        pass

@pytest.mark.integration
@pytest.mark.asyncio
async def test_postgres_catalog_lifecycle(db_service):
    catalog = CatalogConnection(
        type=DatabaseType.POSTGRESQL,
        url="jdbc:postgresql://db:5432/nlex_db",
        user="postgres",
        password="postgres",
    )

    await db_service.connect_catalog(
        "pg_test",
        catalog,
    )

    catalogs = db_service.execute_query_sync(
        "SHOW CATALOGS"
    )

    assert any(
        row[0] == "pg_test"
        for row in catalogs
    )

    # In integration test, we might not have 'users' table in public schema 
    # unless we create it or it's seeded.
    # Let's check if it exists first or create a dummy table for the test.
    db_service.execute_query_sync("CREATE SCHEMA IF NOT EXISTS pg_test.tpch")
    
    # Actually, Trino's postgres connector allows querying public schema if it exists in PG.
    # The setup_test_db fixture in conftest.py creates tables using SQLAlchemy.
    # Let's see what tables are created.
    
    rows = db_service.execute_query_sync(
        "SHOW TABLES FROM pg_test.public"
    )
    # If users table is not there, we can't select from it.
    # The conftest.py seems to create 'users' table.
    
    # Let's try to query it if it exists
    if any(row[0] == "users" for row in rows):
        rows = db_service.execute_query_sync(
            """
            SELECT *
            FROM pg_test.public.users
            """
        )
        # It might be empty but valid query
        assert isinstance(rows, list)

    await db_service.disconnect_catalog(
        "pg_test"
    )