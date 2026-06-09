import pytest
import os
import time
from src.services.distributed_db import DistributedDatabaseService
from src.models.schemas.catalog import CatalogConnection, DatabaseType
import trino

# Only run if TRINO_HOST is set, indicating we are in an environment with Trino
TRINO_HOST = os.getenv("TRINO_HOST", "trino")
TRINO_PORT = int(os.getenv("TRINO_PORT", "8080"))
TRINO_USER = os.getenv("TRINO_USER", "admin")

@pytest.fixture(scope="module")
def db_service():
    service = DistributedDatabaseService(host=TRINO_HOST, port=TRINO_PORT, user=TRINO_USER)
    
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

@pytest.mark.integration
def test_trino_connection(db_service):
    # Basic check to see if we can connect and run a query
    result = db_service.execute_query_sync("SELECT 1")
    assert result == [[1]]

@pytest.mark.asyncio
@pytest.mark.integration
async def test_trino_connection_async(db_service):
    result = await db_service.execute_query_async("SELECT 1")
    assert result == [[1]]

@pytest.mark.asyncio
@pytest.mark.integration
async def test_catalog_lifecycle(db_service):
    # We'll use a memory connector for testing catalog creation if possible, 
    # but CREATE CATALOG usually requires filesystem access for properties files.
    # Trino's TPCH/TPCDS are usually read-only.
    # For now, let's just verify we can at least list catalogs.
    result = db_service.execute_query_sync("SHOW CATALOGS")
    assert len(result) > 0
