import pytest
from src.services.llm_service import LLMService

@pytest.mark.asyncio
async def test_llm_service_connectivity():
    """
    Test that LLMService can connect to the API and receive a response.
    Requires OPENAI_API_KEY to be set in environment.
    """
    try:
        service = LLMService()
    except ValueError as e:
        pytest.skip(f"LLMService not configured: {e}")

    # Very simple prompt to test connectivity
    schema = "table users (id integer, name string)"
    user_prompt = "list all users"
    
    # We use generate_sql as it's the primary entry point
    response = service.generate_sql(user_prompt, schema)

    print(response)
    
    # Check that we got a valid response status and it is NOT an error.
    # This will now fail the test if the API returns 401, 403, or other connection errors.
    assert "status" in response
    assert response["status"] in ["success", "clarification"], f"LLM Service returned an error: {response.get('message')}"
    
    print(f"LLM responded successfully with status: {response['status']}")

def test_llm_service_custom_config():
    """
    Test that LLMService properly prioritizes provided constructor arguments over .env settings.
    """
    custom_api_key = "test_custom_key_123"
    custom_base_url = "https://custom.api.ai/v1/chat/completions"
    custom_model = "test-model-70b"

    service = LLMService(
        api_key=custom_api_key,
        base_url=custom_base_url,
        model=custom_model
    )

    assert service.client.api_key == custom_api_key
    assert service.client.base_url == "https://custom.api.ai/v1/" # base_url is parsed
    assert service.model == custom_model
