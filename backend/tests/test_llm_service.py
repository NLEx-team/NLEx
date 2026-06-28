import pytest
from src.services.llm_service import LLMService

@pytest.mark.skip(reason="LLM API not available in test container")
@pytest.mark.asyncio
async def test_llm_service_connectivity():
    try:
        service = LLMService()
    except ValueError as e:
        pytest.skip(f"LLMService not configured: {e}")

    schema = "table users (id integer, name string)"
    user_prompt = "list all users"
    response = service.generate_sql(user_prompt, schema)
    print(response)
    assert "status" in response
    assert response["status"] in ["success", "clarification"], f"LLM Service returned an error: {response.get('message')}"
    print(f"LLM responded successfully with status: {response['status']}")

@pytest.mark.skip(reason="LLMService constructor no longer accepts custom args")
def test_llm_service_custom_config():
    pass
