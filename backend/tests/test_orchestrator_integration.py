import pytest
import os
import json
from src.services.distributed_db import DistributedDatabaseService
from src.services.schema_service import SchemaService
from src.services.llm_service import LLMService
from src.services.relationship_inference_service import RelationshipInferenceService
from src.services.sql_generation_service import SQLGenerationService
from src.services.orchestrator_service import OrchestratorService
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

@pytest.mark.skip(reason="pagila db not available")
@pytest.mark.asyncio
async def test_orchestrator_integration_pagila(trino_config, external_db_config):
    # 1. Initialize all services
    dds = DistributedDatabaseService(
        host=trino_config["host"],
        port=trino_config["port"],
        user="trino"
    )
    ss = SchemaService(dds)
    try:
        ls = LLMService()
    except ValueError as e:
        pytest.skip(f"LLMService not configured: {e}")
        
    ris = RelationshipInferenceService(ss, ls)
    sqls = SQLGenerationService(ls)
    
    orchestrator = OrchestratorService(
        db_service=dds,
        schema_service=ss,
        inference_service=ris,
        sql_service=sqls,
        llm_service=ls
    )
    
    catalog_name = "pagila_orchestrator_test"
    jdbc_url = f"jdbc:postgresql://{external_db_config['host']}:{external_db_config['port']}/{external_db_config['database']}"
    
    try:
        # Step 1: Connect Catalog
        print(f"\n[1] Connecting catalog '{catalog_name}'...")
        await orchestrator.connect_catalog(
            name=catalog_name,
            catalog_config=CatalogConnection(
                type=DatabaseType.POSTGRESQL,
                url=jdbc_url,
                user=external_db_config["user"],
                password=external_db_config["password"]
            )
        )
        print(f"Connected. State: {orchestrator.state.value}")
        
        # Step 2: Infer Relationships
        print(f"\n[2] Inferring relationships for '{catalog_name}'...")
        schema = await orchestrator.infer_relationships()
        print(f"Relationships inferred. State: {orchestrator.state.value}")
        # print(f"Schema: {json.dumps(schema, indent=2, ensure_ascii=False)[:500]}...")
        
        # Step 3: Execute User Query
        user_prompt = "List 5 actors from the actor table, show their first and last names."
        print(f"\n[3] Executing user query: '{user_prompt}'")
        result = await orchestrator.execute_user_query(user_prompt)
        
        print("\n--- QUERY RESULT ---")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        print("--------------------")
        
        assert result["status"] == "success"
        assert "data" in result
        assert len(result["data"]) == 5
        assert len(result["data"][0]) == 2 # first_name, last_name
        
    finally:
        # Cleanup
        print(f"\n[Cleanup] Disconnecting catalog '{catalog_name}'...")
        try:
            await dds.disconnect_catalog(catalog_name)
        except Exception as e:
            print(f"Error during cleanup: {e}")
