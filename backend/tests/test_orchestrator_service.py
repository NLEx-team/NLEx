import pytest
from unittest.mock import AsyncMock, MagicMock
from src.services.orchestrator_service import OrchestratorService, OrchestratorState

@pytest.fixture
def mock_db_service():
    service = MagicMock()
    service.execute_query_async = AsyncMock(return_value=[[1]])
    service.execute_query_async_preview = AsyncMock(return_value=[[1]])
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
    service.generate_sql = AsyncMock()
    return service

@pytest.fixture
def mock_llm_service():
    return MagicMock()

@pytest.fixture
def orchestrator(mock_db_service, mock_schema_service, mock_inference_service, mock_sql_service, mock_llm_service):
    orch = OrchestratorService(
        db_service=mock_db_service,
        schema_service=mock_schema_service,
        inference_service=mock_inference_service,
        sql_service=mock_sql_service,
        llm_service=mock_llm_service
    )
    orch.active_catalogs = {"test_cat": "test_alias"}
    return orch

@pytest.mark.asyncio
async def test_orchestrator_success_path(orchestrator, mock_sql_service, mock_db_service, mock_inference_service):
    # Setup
    mock_inference_service.get_augmented_schema.return_value = {"catalog": "test", "schemas": [], "relationships": []}
    mock_sql_service.generate_sql.return_value = {
        "status": "success",
        "sql": "SELECT 1",
        "headers": ["col1"],
        "explanation": "test"
    }
    mock_db_service.execute_query_async.return_value = [[1]]
    
    # Infer
    await orchestrator.initialize_session({"test_cat": "test"})
    await orchestrator.infer_relationships()
    assert orchestrator.state == OrchestratorState.AWAITING_USER_QUERY
    
    # Execute
    result = await orchestrator.execute_user_query("show me data")

    assert result["status"] == "success"
    assert result["data"] == [[1]]
    assert orchestrator.state == OrchestratorState.COMPLETED

@pytest.mark.asyncio
async def test_orchestrator_retry_path(orchestrator, mock_sql_service, mock_db_service, mock_inference_service):
    mock_inference_service.get_augmented_schema.return_value = {"catalog": "test", "schemas": [], "relationships": []}
    
    # First SQL call returns a bad query
    # Second SQL call returns a fixed query
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
    
    # First call returns clarification
    # Second call returns success
    mock_sql_service.generate_sql.side_effect = [
        {
            "status": "clarification",
            "question": "Which one?",
            "options": ["A", "B"]
        },
        {
            "status": "success",
            "sql": "SELECT A",
            "headers": ["A"],
            "explanation": "e"
        }
    ]
    
    await orchestrator.initialize_session({"test_cat": "test"})
    await orchestrator.infer_relationships()
    result = await orchestrator.execute_user_query("query")

    assert result["status"] == "clarification"
    assert result["question"] == "Which one?"
    assert orchestrator.state == OrchestratorState.CLARIFICATION_REQUIRED
    
    # User provides answer
    result2 = await orchestrator.handle_clarification("A")
    
    assert result2["status"] == "success"
    assert result2["sql"] == "SELECT A"
    assert orchestrator.state == OrchestratorState.COMPLETED
