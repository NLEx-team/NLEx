import pytest
from unittest.mock import AsyncMock, MagicMock
from src.services.schema_service import SchemaService
from src.services.distributed_db import DistributedDatabaseService

@pytest.fixture
def mock_db():
    return MagicMock(spec=DistributedDatabaseService)

@pytest.fixture
def schema_service(mock_db):
    return SchemaService(mock_db)

@pytest.mark.asyncio
async def test_get_full_schema(schema_service, mock_db):
    # Setup mocks
    mock_db.get_namespaces.return_value = ["information_schema", "sales"]
    mock_db.get_catalog_type.return_value = "postgresql"
    mock_db.get_tables.return_value = ["orders"]
    mock_db.get_columns.return_value = [
        {"name": "order_id", "type": "bigint", "nullable": False, "position": 1},
        {"name": "customer_id", "type": "integer", "nullable": True, "position": 2}
    ]

    async def execute_query_side_effect(query):
        if "information_schema.columns" in query and "WHERE" in query:
            return [
                ["sales", "orders", "order_id", "bigint", "NO", 1],
                ["sales", "orders", "customer_id", "integer", "YES", 2],
            ]
        if "LIMIT 5" in query:
            return [
                [123, 456],
                [124, 457],
                [125, None]
            ]
        if "information_schema.key_column_usage" in query:
            return [
                ["sales", "orders", "customer_id", "sales", "customers", "id"]
            ]
        if "information_schema.columns" in query:
            return [
                ["sales", "orders", "order_id", "bigint", "NO", 1],
                ["sales", "orders", "customer_id", "integer", "YES", 2]
            ]
        return []

    mock_db.execute_query_async.side_effect = execute_query_side_effect

    # Execute
    result = await schema_service.get_full_schema("hive")

    # Assertions
    assert result["catalog"] == "hive"
    assert len(result["schemas"]) == 1
    assert result["schemas"][0]["name"] == "sales"

    tables = result["schemas"][0]["tables"]
    assert len(tables) == 1
    assert tables[0]["name"] == "orders"
    assert "relationships" not in tables[0]

    columns = tables[0]["columns"]
    assert len(columns) == 2

    assert columns[0]["name"] == "order_id"
    assert columns[0]["samples"] == ["123", "124", "125"]

    assert columns[1]["name"] == "customer_id"
    assert columns[1]["samples"] == ["456", "457"]

    assert len(result["relationships"]) == 1
    rel = result["relationships"][0]
    assert rel["from_table"] == "sales.orders"
    assert rel["from_column"] == "customer_id"
    assert rel["to_table"] == "sales.customers"
    assert rel["to_column"] == "id"
    assert rel["confidence"] == 1.0

    # Verify mock calls
    mock_db.get_namespaces.assert_called_once_with("hive")
    mock_db.get_catalog_type.assert_called_once_with("hive")
    mock_db.get_tables.assert_called_once_with("hive", "sales")
    mock_db.execute_query_async.assert_any_call('SELECT * FROM "hive"."sales"."orders" LIMIT 5')

