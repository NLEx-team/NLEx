"""
Сервис генерации SQL.
Оркестрирует вызов LLM, санитизацию SQL и обогащает ответ отладочной информацией.
"""

import logging
import time
from typing import Any

from src.services.llm_service import LLMService
from src.services import sql_guard

logger = logging.getLogger(__name__)

# Human-readable messages for read-only violation codes (see sql_guard).
# Values are user-facing and stay in Russian (shown to the end user).
_VIOLATION_MESSAGES_RU = {
    sql_guard.VIOLATION_EMPTY: "Сгенерирован пустой запрос.",
    sql_guard.VIOLATION_TOO_LONG: "Сгенерированный запрос слишком длинный. Попробуйте упростить вопрос.",
    sql_guard.VIOLATION_FORBIDDEN: "Сгенерированный запрос содержит запрещённые операции. Разрешены только SELECT-запросы.",
    sql_guard.VIOLATION_STACKED: "Сгенерированный запрос содержит несколько инструкций. Разрешён только один SELECT-запрос.",
    sql_guard.VIOLATION_NOT_SELECT: "Разрешены только SELECT-запросы.",
}


class SQLGenerationService:
    def __init__(self, llm_service: LLMService | None = None):
        self.llm_service = llm_service or LLMService()

    async def generate_sql(
        self, 
        user_prompt: str | None, 
        schema: str, 
        history: list[dict[str, str]] | None = None,
        language: str = "ru"
    ) -> dict[str, Any]:
        """
        Генерирует SQL-запрос для Trino на основе вопроса пользователя.
        Схема (schema) содержит структуру всех таблиц из всех каталогов.
        """
        import asyncio
        
        # Валидация входных данных
        if (not user_prompt or not user_prompt.strip()) and not history:
            return {"status": "error", "message": "Вопрос не может быть пустым."}

        if not schema or not schema.strip():
            return {"status": "error", "message": "Схема БД не предоставлена. Подключите хотя бы один каталог."}

        start_time = time.perf_counter()

        # Вызов LLM
        result = await asyncio.to_thread(
            self.llm_service.generate_sql,
            user_prompt=user_prompt, 
            schema=schema, 
            history=history,
            language=language
        )
        
        llm_time_ms = int((time.perf_counter() - start_time) * 1000)

        # SQL sanitization via the central read-only guard (see sql_guard).
        # This is the second line of defense after the system prompt.
        if isinstance(result, dict) and result.get("status") == "success":
            sql = result.get("sql", "")

            violation = sql_guard.read_only_violation(sql)
            if violation is not None:
                logger.warning(
                    "LLM SQL rejected by read-only guard (%s). Prompt: %s",
                    violation,
                    user_prompt[:200] if user_prompt else "",
                )
                return {
                    "status": "error",
                    "message": _VIOLATION_MESSAGES_RU.get(
                        violation, "Разрешены только SELECT-запросы."
                    ),
                }

            # Normalize: trim whitespace and any trailing semicolon
            result["sql"] = sql.strip().rstrip(";")

        # Добавляем отладочную информацию
        if isinstance(result, dict):
            result["_debug"] = {
                "llm_time_ms": llm_time_ms,
            }
            
        logger.info(
            "SQL generation completed in %dms | status=%s | prompt_len=%d",
            llm_time_ms,
            result.get("status", "unknown") if isinstance(result, dict) else "invalid",
            len(user_prompt) if user_prompt else 0,
        )

        return result
