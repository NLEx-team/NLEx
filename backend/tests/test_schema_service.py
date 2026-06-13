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
    mock_db.get_tables.return_value = ["orders"]
    mock_db.get_columns.return_value = [
        {"name": "order_id", "type": "bigint", "nullable": False, "position": 1},
        {"name": "customer_id", "type": "integer", "nullable": True, "position": 2}
    ]
    # sample_rows for SELECT * FROM hive.sales.orders LIMIT 3
    mock_db.execute_query_async.return_value = [
        [123, 456],
        [124, 457],
        [125, None]
    ]

    # Execute
    result = await schema_service.get_full_schema("hive")

    # Assertions
    assert result["catalog"] == "hive"
    assert len(result["schemas"]) == 1
    assert result["schemas"][0]["name"] == "sales"
    
    tables = result["schemas"][0]["tables"]
    assert len(tables) == 1
    assert tables[0]["name"] == "orders"
    
    columns = tables[0]["columns"]
    assert len(columns) == 2
    
    assert columns[0]["name"] == "order_id"
    assert columns[0]["type"] == "bigint"
    assert columns[0]["nullable"] is False
    assert columns[0]["samples"] == ["123", "124", "125"]
    
    assert columns[1]["name"] == "customer_id"
    assert columns[1]["type"] == "integer"
    assert columns[1]["nullable"] is True
    assert columns[1]["samples"] == ["456", "457"] # None should be filtered out
    
    assert tables[0]["relationships"] == []

    # Verify mock calls
    mock_db.get_namespaces.assert_called_once_with("hive")
    mock_db.get_tables.assert_called_once_with("hive", "sales")
    mock_db.get_columns.assert_called_once_with("hive", "sales", "orders")
    mock_db.execute_query_async.assert_called_once_with("SELECT * FROM hive.sales.orders LIMIT 3")
