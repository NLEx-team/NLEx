"""
Сервис генерации SQL.
Оркестрирует вызов LLM, санитизацию SQL и обогащает ответ отладочной информацией.
"""

import logging
import re
import time
from typing import Any

from src.services.llm_service import LLMService

logger = logging.getLogger(__name__)

# Запрещённые операции (второй рубеж защиты после промпта)
_FORBIDDEN_PATTERN = re.compile(
    r"\b(DROP|DELETE|UPDATE|INSERT|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|MERGE)\b",
    re.IGNORECASE,
)

# Максимальная длина SQL (защита от аномально больших ответов)
_MAX_SQL_LENGTH = 10_000


class SQLGenerationService:
    def __init__(self, llm_service: LLMService | None = None):
        self.llm_service = llm_service or LLMService()

    async def generate_sql(
        self, 
        user_prompt: str | None, 
        schema: str, 
        history: list[dict[str, str]] | None = None
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
            history=history
        )
        
        llm_time_ms = int((time.perf_counter() - start_time) * 1000)

        # Санитизация SQL (второй рубеж после промпта)
        if isinstance(result, dict) and result.get("status") == "success":
            sql = result.get("sql", "")

            # Проверка на запрещённые операции (игнорируем слова в кавычках)
            sql_no_quotes = re.sub(r"'[^']*'", '', sql)
            sql_no_quotes = re.sub(r'"[^"]*"', '', sql_no_quotes)
            
            if _FORBIDDEN_PATTERN.search(sql_no_quotes):
                logger.warning(
                    "LLM generated forbidden SQL operation. Query rejected. Prompt: %s",
                    user_prompt[:200] if user_prompt else "",
                )
                return {
                    "status": "error",
                    "message": "Сгенерированный запрос содержит запрещённые операции. Разрешены только SELECT-запросы.",
                }

            # Проверка длины
            if len(sql) > _MAX_SQL_LENGTH:
                logger.warning("LLM generated SQL exceeds max length: %d chars", len(sql))
                return {
                    "status": "error",
                    "message": "Сгенерированный запрос слишком длинный. Попробуйте упростить вопрос.",
                }

            # Нормализация: убираем лишние пробелы и точку с запятой в конце
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
