import pytest
import os

from src.services.distributed_db import DistributedDatabaseService
from src.services.schema_service import SchemaService
from src.models.schemas.catalog import CatalogConnection, DatabaseType

@pytest.fixture
def external_db_config():
    host = os.getenv("TEST_PAGILA_HOST")
    port = os.getenv("TEST_PAGILA_PORT")
    user = os.getenv("TEST_POSTGRES_USER")
    password = os.getenv("TEST_POSTGRES_PASSWORD")
    database = os.getenv("TEST_PAGILA_DB", "pagila")
    
    if not all([host, port, user, password]):
        pytest.skip("Pagila test environment variables not set")
        
    return {
        "host": host,
        "port": port,
        "user": user,
        "password": password,
        "database": database
    }

@pytest.fixture
def trino_config():
    host = os.getenv("TRINO_HOST", "localhost")
    port = os.getenv("TRINO_PORT", "8080")
    return {
        "host": host,
        "port": int(port)
    }

@pytest.fixture
def dds(trino_config):
    service = DistributedDatabaseService(
        host=trino_config["host"],
        port=trino_config["port"],
        user="trino"
    )
    yield service

@pytest.fixture
def ss(dds):
    yield SchemaService(dds)

@pytest.mark.asyncio
async def test_using_pagila(dds, ss, external_db_config):
    catalog_name = "pagila_test"
    jdbc_url = f"jdbc:postgresql://{external_db_config['host']}:{external_db_config['port']}/{external_db_config['database']}"
    
    try:
        # 1. Connect to catalog
        await dds.connect_catalog(
            name=catalog_name,
            catalog=CatalogConnection(
                type=DatabaseType.POSTGRESQL,
                url=jdbc_url,
                user=external_db_config["user"],
                password=external_db_config["password"]
            )
        )
        
        # 2. Get full schema
        result = await ss.get_full_schema(catalog_name)

        print(result)
        
        # 3. Assertions
        assert result["catalog"] == catalog_name
        assert "schemas" in result
        assert len(result["schemas"]) > 0
        
        # Find 'public' schema
        public_schema = next((s for s in result["schemas"] if s["name"] == "public"), None)
        assert public_schema is not None, "Public schema not found in Pagila"
        
        # Check for common Pagila tables
        table_names = [t["name"] for t in public_schema["tables"]]
        assert "actor" in table_names
        assert "film" in table_names
        
        # Check table structure for 'actor'
        actor_table = next(t for t in public_schema["tables"] if t["name"] == "actor")
        column_names = [c["name"] for c in actor_table["columns"]]
        assert "actor_id" in column_names
        assert "first_name" in column_names
        assert "last_name" in column_names
        
        # Check samples (assuming there is data in the actor table)
        first_name_col = next(c for c in actor_table["columns"] if c["name"] == "first_name")
        # Samples might be empty if the DB is empty, but usually Pagila comes with data
        assert isinstance(first_name_col["samples"], list)
        
    finally:
        # Cleanup
        try:
            await dds.disconnect_catalog(catalog_name)
        except Exception as e:
            print(f"Error during cleanup: {e}")
    
