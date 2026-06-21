from fastapi import Header
from typing import Optional
from src.services.llm_service import LLMService

def get_llm_service(
    llm_api_key: Optional[str] = Header(None),
    llm_base_url: Optional[str] = Header(None),
    llm_model: Optional[str] = Header(None),
) -> LLMService:
    """
    FastAPI dependency that parses LLM credentials from HTTP headers.
    If headers are not provided, LLMService falls back to .env settings.
    """
    return LLMService(
        api_key=llm_api_key,
        base_url=llm_base_url,
        model=llm_model
    )
