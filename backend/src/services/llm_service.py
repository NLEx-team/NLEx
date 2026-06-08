"""
Сервис для работы с LLM.
Отправляет запрос в OpenAI API и парсит JSON-ответ.
"""

import json
from typing import Any

from openai import OpenAI, OpenAIError
from src.utils.config import settings
from src.utils.prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE

class LLMService:
    def __init__(self):
        self.model = settings.LLM_MODEL
        self.client = OpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL,
        )

    def generate_sql(self, user_prompt: str, schema: str, dialect: str = "PostgreSQL") -> dict[str, Any]:
        # Формируем тексты сообщений
        system_message = SYSTEM_PROMPT.format(dialect=dialect)
        user_message = USER_PROMPT_TEMPLATE.format(
            schema=schema,
            user_prompt=user_prompt,
        )

        try:
            # Вызываем API.
            # response_format поддерживается OpenAI, но может не поддерживаться другими провайдерами.
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.0,
                response_format={"type": "json_object"},
            )
        except OpenAIError as exc:
            raise RuntimeError("Ошибка при обращении к LLM API") from exc

        try:
            # Парсим ответ
            raw_response = response.choices[0].message.content
        except (IndexError, AttributeError) as exc:
            raise ValueError("LLM API вернул ответ в неверном формате") from exc

        if not raw_response:
            raise ValueError("LLM API вернул пустой ответ")

        try:
            result = json.loads(raw_response)
        except json.JSONDecodeError as exc:
            raise ValueError("LLM API вернул невалидный JSON") from exc

        return result