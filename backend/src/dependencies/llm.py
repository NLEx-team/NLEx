from src.services.llm_service import LLMService


def get_llm_service() -> LLMService:
    """
    FastAPI dependency that provides an LLMService instance.
    All credentials are loaded from server-side .env.secret via settings.
    """
    return LLMService()
