import pytest
from unittest.mock import AsyncMock, MagicMock
from src.services.orchestrator_service import OrchestratorService, OrchestratorState

@pytest.fixture
def mock_db_service():
    service = MagicMock()
    service.execute_query_async = AsyncMock()
    return service

@pytest.fixture
def mock_schema_service():
    return MagicMock()

@pytest.fixture
def mock_inference_service():
    service = MagicMock()
    service.get_augmented_schema = AsyncMock()
    return service

@pytest.fixture
def mock_sql_service():
    service = MagicMock()
    service.generate_sql = MagicMock()
    return service

@pytest.fixture
def mock_llm_service():
    return MagicMock()

@pytest.fixture
def orchestrator(mock_db_service, mock_schema_service, mock_inference_service, mock_sql_service, mock_llm_service):
    return OrchestratorService(
        db_service=mock_db_service,
        schema_service=mock_schema_service,
        inference_service=mock_inference_service,
        sql_service=mock_sql_service,
        llm_service=mock_llm_service
    )

@pytest.mark.asyncio
async def test_orchestrator_success_path(orchestrator, mock_sql_service, mock_db_service, mock_inference_service):
    mock_inference_service.get_augmented_schema.return_value = {"catalog": "test", "schemas": [], "relationships": []}
    mock_sql_service.generate_sql.return_value = {
        "status": "success",
        "sql": "SELECT 1",
        "headers": ["col1"],
        "explanation": "test"
    }
    mock_db_service.execute_query_async.return_value = [[1]]

    await orchestrator.initialize_session({"test_cat": "test"})
    await orchestrator.infer_relationships()
    assert orchestrator.state == OrchestratorState.AWAITING_USER_QUERY

    result = await orchestrator.execute_user_query("show me data")

    assert result["status"] == "success"
    assert result["data"] == [[1]]
    assert orchestrator.state == OrchestratorState.COMPLETED

@pytest.mark.asyncio
async def test_orchestrator_retry_path(orchestrator, mock_sql_service, mock_db_service, mock_inference_service):
    mock_inference_service.get_augmented_schema.return_value = {"catalog": "test", "schemas": [], "relationships": []}

    mock_sql_service.generate_sql.side_effect = [
        {"status": "success", "sql": "BAD SQL", "headers": ["h"], "explanation": "e"},
        {"status": "success", "sql": "GOOD SQL", "headers": ["h"], "explanation": "e"}
    ]

    mock_db_service.execute_query_async.side_effect = [
        Exception("Syntax error"),
        [[1]]
    ]

    await orchestrator.initialize_session({"test_cat": "test"})
    await orchestrator.infer_relationships()
    result = await orchestrator.execute_user_query("query")

    assert result["status"] == "success"
    assert result["sql"] == "GOOD SQL"
    assert result["attempts"] == 2
    assert orchestrator.state == OrchestratorState.COMPLETED

@pytest.mark.asyncio
async def test_orchestrator_clarification_path(orchestrator, mock_sql_service, mock_inference_service):
    mock_inference_service.get_augmented_schema.return_value = {"catalog": "test", "schemas": [], "relationships": []}

    mock_sql_service.generate_sql.side_effect = [
        {"status": "clarification", "question": "which year?"},
        {"status": "success", "sql": "SELECT 1", "headers": ["h"], "explanation": "e"}
    ]

    await orchestrator.initialize_session({"test_cat": "test"})
    await orchestrator.infer_relationships()
    result = await orchestrator.execute_user_query("query")

    assert result["status"] == "clarification"
    assert orchestrator.state == OrchestratorState.CLARIFICATION_REQUIRED

    result = await orchestrator.handle_clarification("2023")
    assert result["status"] == "success"
    assert orchestrator.state == OrchestratorState.COMPLETED
