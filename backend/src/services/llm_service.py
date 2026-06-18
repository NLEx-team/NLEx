"""
Service for working with LLM.
Sends a request to the OpenAI-compatible API and parses the JSON response.
Includes retry with exponential backoff, timeouts, and response validation.
"""

import json
import logging
import time
from typing import Any

from openai import OpenAI, OpenAIError, APITimeoutError, RateLimitError, APIConnectionError
from src.utils.config import settings
from src.utils.prompts import (
    SYSTEM_PROMPT, 
    USER_PROMPT_TEMPLATE,
    RELATIONSHIP_INFERENCE_SYSTEM_PROMPT,
    RELATIONSHIP_INFERENCE_USER_PROMPT_TEMPLATE
)

logger = logging.getLogger(__name__)

# Valid statuses in LLM response
_VALID_STATUSES = frozenset({"success", "clarification", "error"})

# Required fields for each status (for SQL generation)
_SQL_REQUIRED_FIELDS: dict[str, set[str]] = {
    "success": {"sql", "headers", "explanation"},
    "clarification": {"question"},
    "error": {"message"},
}

# Required fields for relationship inference
_INFERENCE_REQUIRED_FIELDS: dict[str, set[str]] = {
    "success": {"relationships"},
    "error": {"message"},
}

# Errors for which it makes sense to retry the request
_RETRYABLE_ERRORS = (APITimeoutError, RateLimitError, APIConnectionError)

# Retry configuration
_MAX_RETRIES = 3
_BASE_DELAY = 1.0  # seconds
_REQUEST_TIMEOUT = 60.0  # seconds


class LLMService:
    def __init__(self):
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not configured")

        self.model = settings.LLM_MODEL

        # Remove /chat/completions from base_url if present, as SDK appends it
        base_url = settings.OPENAI_BASE_URL
        if base_url and base_url.endswith("/chat/completions"):
            base_url = base_url.rsplit("/chat/completions", 1)[0]

        self.client = OpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=base_url,
            timeout=_REQUEST_TIMEOUT,
        )

    def generate_sql(
        self, 
        user_prompt: str | None, 
        schema: str, 
        history: list[dict[str, str]] | None = None
    ) -> dict[str, Any]:
        """
        Generates Trino SQL query based on user question and schema.
        Includes retry on transient errors and response validation.
        """
        if not history:
            # First call: include schema and prompt
            user_message = USER_PROMPT_TEMPLATE.format(
                schema=schema,
                user_prompt=user_prompt or "",
            )
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ]
        else:
            # Subsequent call: use history and optionally append new prompt
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                *history,
            ]
            if user_prompt:
                messages.append({"role": "user", "content": user_prompt})

        return self._execute_with_retry(messages, "sql")

    def infer_relationships(self, schema_json: str) -> dict[str, Any]:
        """
        Infers relationships between tables based on schema JSON.
        """
        user_message = RELATIONSHIP_INFERENCE_USER_PROMPT_TEMPLATE.format(
            schema=schema_json
        )

        messages = [
            {"role": "system", "content": RELATIONSHIP_INFERENCE_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ]

        return self._execute_with_retry(messages, "inference")

    def _execute_with_retry(self, messages: list[dict[str, str]], task_type: str) -> dict[str, Any]:
        """
        Executes LLM call with exponential backoff retry.
        """
        last_error: Exception | None = None
        for attempt in range(_MAX_RETRIES):
            try:
                result = self._call_llm(messages, task_type)
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
                # Invalid JSON / invalid structure — retry as well
                last_error = e
                if attempt < _MAX_RETRIES - 1:
                    logger.warning(
                        "LLM returned invalid response (attempt %d/%d): %s",
                        attempt + 1, _MAX_RETRIES, str(e),
                    )
                    time.sleep(_BASE_DELAY)
                    continue
            except OpenAIError as e:
                # Non-transient errors (auth, bad request) — do not retry
                logger.error("LLM non-retryable error: %s", str(e))
                return {"status": "error", "message": f"API Error: {str(e)}"}

        # All attempts exhausted
        error_msg = str(last_error) if last_error else "Unknown error"
        logger.error("LLM all %d attempts exhausted. Last error: %s", _MAX_RETRIES, error_msg)
        return {"status": "error", "message": "Service temporarily unavailable. Please try again later."}

    def _call_llm(self, messages: list[dict[str, str]], task_type: str) -> dict[str, Any]:
        """
        Single LLM call with parsing and validation.
        Raises: json.JSONDecodeError, ValueError, OpenAIError
        """
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.0,
            response_format={"type": "json_object"},
        )

        print(f"LLM response: {response}")

        raw_response = response.choices[0].message.content
        if not raw_response:
            raise ValueError("Empty response from LLM")

        result = json.loads(raw_response)
        self._validate_response(result, task_type)
        return result

    @staticmethod
    def _validate_response(result: dict[str, Any], task_type: str) -> None:
        """
        Validates LLM response structure.
        Raises ValueError if structure is incorrect.
        """
        if not isinstance(result, dict):
            raise ValueError(f"Response is not a JSON object: {type(result)}")

        # Inference results might not have 'status' if prompt is different,
        # but our prompt says return a JSON object with 'relationships'.
        # However, for consistency with generate_sql, let's allow it to be more flexible.

        if task_type == "sql":
            status = result.get("status")
            if status not in _VALID_STATUSES:
                raise ValueError(f"Unknown status: '{status}'. Valid: {_VALID_STATUSES}")

            missing = _SQL_REQUIRED_FIELDS[status] - result.keys()
            if missing:
                raise ValueError(f"Missing required fields for status='{status}': {missing}")

            if status == "success":
                sql = result["sql"]
                headers = result["headers"]
                if not isinstance(sql, str) or not sql.strip():
                    raise ValueError("Field 'sql' is empty or not a string")
                if not isinstance(headers, list) or len(headers) == 0:
                    raise ValueError("Field 'headers' is empty or not an array")

        elif task_type == "inference":
            # Relationship inference prompt expects {"relationships": [...]}
            if "relationships" not in result and "status" not in result:
                 raise ValueError("Missing 'relationships' field in inference response")

            if "relationships" in result and not isinstance(result["relationships"], list):
                raise ValueError("'relationships' must be a list")