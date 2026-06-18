import pytest
from unittest.mock import MagicMock, patch
from src.services.distributed_db import DistributedDatabaseService
from src.models.schemas.catalog import CatalogConnection, DatabaseType

@pytest.fixture
def db_service():
    return DistributedDatabaseService(host="localhost", port=8080, user="admin")

def test_execute_query_sync(db_service):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.description = [("col1",)]
    mock_cursor.fetchall.return_value = [["val1"], ["val2"]]

    with patch("trino.dbapi.connect", return_value=mock_conn):
        result = db_service.execute_query_sync("SELECT * FROM table")
        
    assert result == [["val1"], ["val2"]]
    mock_cursor.execute.assert_called_once_with("SELECT * FROM table")

@pytest.mark.asyncio
async def test_execute_query_async(db_service):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.description = [("col1",)]
    mock_cursor.fetchall.return_value = [["val1"]]

    with patch("trino.dbapi.connect", return_value=mock_conn):
        result = await db_service.execute_query_async("SELECT * FROM table")
        
    assert result == [["val1"]]
    mock_cursor.execute.assert_called_once_with("SELECT * FROM table")

@pytest.mark.asyncio
async def test_connect_catalog(db_service):
    catalog = CatalogConnection(
        type=DatabaseType.POSTGRESQL,
        url="jdbc:postgresql://db:5432/test",
        user="user",
        password="password"
    )
    
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.description = None # CREATE CATALOG doesn't return rows

    with patch("trino.dbapi.connect", return_value=mock_conn):
        await db_service.connect_catalog("my_pg", catalog)
    
    # Verify the SQL
    called_sql = mock_cursor.execute.call_args[0][0]
    assert "CREATE CATALOG my_pg" in called_sql
    assert "USING postgresql" in called_sql
    assert "'jdbc:postgresql://db:5432/test'" in called_sql
    assert "'user'" in called_sql
    assert "'password'" in called_sql

@pytest.mark.asyncio
async def test_disconnect_catalog(db_service):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.description = None

    with patch("trino.dbapi.connect", return_value=mock_conn):
        await db_service.disconnect_catalog("my_pg")
    
    mock_cursor.execute.assert_called_once_with("DROP CATALOG IF EXISTS my_pg")

def test_validate_catalog_name(db_service):
    # Should not raise
    db_service._validate_catalog_name("valid_name_123")
    
    # Should raise
    with pytest.raises(ValueError, match="Invalid catalog name"):
        db_service._validate_catalog_name("invalid-name")
    
    with pytest.raises(ValueError, match="Invalid catalog name"):
        db_service._validate_catalog_name("123invalid")
    
    with pytest.raises(ValueError, match="Invalid catalog name"):
        db_service._validate_catalog_name("drop catalog")
