"""
Сервис для работы с LLM.
Отправляет запрос в OpenAI-совместимый API и парсит JSON-ответ.
Включает retry с экспоненциальным backoff, таймауты, валидацию ответа.
"""

import json
import logging
import time
from typing import Any

from openai import OpenAI, OpenAIError, APITimeoutError, RateLimitError, APIConnectionError
from src.utils.config import settings
from src.utils.prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE

logger = logging.getLogger(__name__)

# Допустимые статусы в ответе LLM
_VALID_STATUSES = frozenset({"success", "clarification", "error"})

# Обязательные поля для каждого статуса
_REQUIRED_FIELDS: dict[str, set[str]] = {
    "success": {"sql", "headers", "explanation"},
    "clarification": {"question"},
    "error": {"message"},
}

# Ошибки, при которых имеет смысл повторять запрос
_RETRYABLE_ERRORS = (APITimeoutError, RateLimitError, APIConnectionError)

# Конфигурация retry
_MAX_RETRIES = 3
_BASE_DELAY = 1.0  # секунды
_REQUEST_TIMEOUT = 60.0  # секунды


class LLMService:
    def __init__(self):
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not configured")
        
        self.model = settings.LLM_MODEL

        # Убираем /chat/completions из base_url если он там есть, так как SDK добавит его сам
        base_url = settings.OPENAI_BASE_URL
        if base_url and base_url.endswith("/chat/completions"):
            base_url = base_url.rsplit("/chat/completions", 1)[0]

        self.client = OpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=base_url,
            timeout=_REQUEST_TIMEOUT,
        )

    def generate_sql(self, user_prompt: str, schema: str) -> dict[str, Any]:
        """
        Генерирует Trino SQL запрос на основе вопроса пользователя и схемы.
        Включает retry при transient-ошибках и валидацию ответа.
        """
        user_message = USER_PROMPT_TEMPLATE.format(
            schema=schema,
            user_prompt=user_prompt,
        )

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ]

        # Retry с экспоненциальным backoff
        last_error: Exception | None = None
        for attempt in range(_MAX_RETRIES):
            try:
                result = self._call_llm(messages)
                return result
            except _RETRYABLE_ERRORS as e:
                last_error = e
                delay = _BASE_DELAY * (2 ** attempt)
                logger.warning(
                    "LLM request failed (attempt %d/%d): %s. Retrying in %.1fs",
                    attempt + 1, _MAX_RETRIES, str(e), delay,
                )
                time.sleep(delay)
            except (json.JSONDecodeError, ValueError) as e:
                # Невалидный JSON / невалидная структура — повторяем тоже (модель может ответить корректно со второй попытки)
                last_error = e
                if attempt < _MAX_RETRIES - 1:
                    logger.warning(
                        "LLM returned invalid response (attempt %d/%d): %s",
                        attempt + 1, _MAX_RETRIES, str(e),
                    )
                    time.sleep(_BASE_DELAY)
                    continue
            except OpenAIError as e:
                # Не-transient ошибки (auth, bad request) — не повторяем
                logger.error("LLM non-retryable error: %s", str(e))
                return {"status": "error", "message": f"Ошибка API: {str(e)}"}

        # Все попытки исчерпаны
        error_msg = str(last_error) if last_error else "Неизвестная ошибка"
        logger.error("LLM all %d attempts exhausted. Last error: %s", _MAX_RETRIES, error_msg)
        return {"status": "error", "message": f"Сервис временно недоступен. Попробуйте позже."}

    def _call_llm(self, messages: list[dict[str, str]]) -> dict[str, Any]:
        """
        Одиночный вызов LLM с парсингом и валидацией ответа.
        Raises: json.JSONDecodeError, ValueError, OpenAIError
        """
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.0,
            response_format={"type": "json_object"},
        )

        raw_response = response.choices[0].message.content
        if not raw_response:
            raise ValueError("Пустой ответ от LLM")

        result = json.loads(raw_response)
        self._validate_response(result)
        return result

    @staticmethod
    def _validate_response(result: dict[str, Any]) -> None:
        """
        Проверяет структуру ответа LLM.
        Raises ValueError если структура некорректна.
        """
        if not isinstance(result, dict):
            raise ValueError(f"Ответ не является JSON-объектом: {type(result)}")

        status = result.get("status")
        if status not in _VALID_STATUSES:
            raise ValueError(f"Неизвестный status: '{status}'. Допустимы: {_VALID_STATUSES}")

        missing = _REQUIRED_FIELDS[status] - result.keys()
        if missing:
            raise ValueError(f"Отсутствуют обязательные поля для status='{status}': {missing}")

        # Дополнительная проверка для success
        if status == "success":
            sql = result["sql"]
            headers = result["headers"]

            if not isinstance(sql, str) or not sql.strip():
                raise ValueError("Поле 'sql' пустое или не строка")

            if not isinstance(headers, list) or len(headers) == 0:
                raise ValueError("Поле 'headers' пустое или не массив")