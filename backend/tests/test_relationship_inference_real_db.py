import pytest
import os
import json
from src.services.distributed_db import DistributedDatabaseService
from src.services.schema_service import SchemaService
from src.services.llm_service import LLMService
from src.services.relationship_inference_service import RelationshipInferenceService
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
    return DistributedDatabaseService(
        host=trino_config["host"],
        port=trino_config["port"],
        user="trino"
    )

@pytest.fixture
def ss(dds):
    return SchemaService(dds)

@pytest.fixture
def llm():
    try:
        return LLMService()
    except ValueError as e:
        pytest.skip(f"LLMService not configured: {e}")

@pytest.fixture
def ris(ss, llm):
    return RelationshipInferenceService(ss, llm)

@pytest.mark.skip(reason="pagila db not available")
@pytest.mark.asyncio
async def test_relationship_inference_pagila(dds, ris, external_db_config):
    """
    Integration test for RelationshipInferenceService using a real Pagila database.
    Fetches the schema and augments it with LLM-inferred relationships.
    Prints the resulting relationships to the terminal.
    """
    catalog_name = "pagila_inference_test"
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
        
        # 2. Get augmented schema
        # This will fetch physical schemas and then call LLM
        print(f"\nFetching augmented schema for {catalog_name}...")
        result = await ris.get_augmented_schema(catalog_name)

        # 3. Print the result for manual inspection
        # We focus on relationships to keep the output readable
        output_focus = {
            "catalog": result["catalog"],
            "physical_relationships_count": len([r for r in result["relationships"] if r["source"] == "foreign_key"]),
            "inferred_relationships_count": len([r for r in result["relationships"] if r["source"] == "inferred"]),
            "all_relationships": result["relationships"]
        }
        
        print("\n=== RELATIONSHIP INFERENCE RESULT ===")
        print(json.dumps(output_focus, indent=2, ensure_ascii=False))
        print("=====================================\n")
        
        # 4. Assertions
        assert result["catalog"] == catalog_name
        assert "all_relationships" in result
        
    finally:
        # Cleanup
        try:
            await dds.disconnect_catalog(catalog_name)
        except Exception as e:
            print(f"Error during cleanup: {e}")
