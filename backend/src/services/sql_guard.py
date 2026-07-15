"""
Central application-level read-only guard.

Ensures that ONLY single read-only queries (a SELECT, or a CTE `WITH ... SELECT`)
ever reach the database. This is the second line of defense after the system
prompt: even if the LLM produces unsafe SQL, or some execution path bypasses the
generation-time check, the query will not be executed.

This module intentionally does NOT import any other service, so it can be used
safely from anywhere without creating circular dependencies.
"""

import re

# Keywords for mutating/dangerous operations (DDL/DML/privileges/session).
# Note: none of these are Trino scalar functions, so there should be no false
# positives on legitimate SELECT queries.
FORBIDDEN_PATTERN = re.compile(
    r"\b(DROP|DELETE|UPDATE|INSERT|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|MERGE)\b",
    re.IGNORECASE,
)

# The query must start with SELECT or WITH (CTE). Leading parentheses are allowed.
READ_ONLY_PREFIX = re.compile(r"^\s*\(*\s*(SELECT|WITH)\b", re.IGNORECASE)

# Maximum SQL length (guards against abnormally large queries).
MAX_SQL_LENGTH = 250_000

# Violation codes that read_only_violation() may return.
VIOLATION_EMPTY = "empty"
VIOLATION_TOO_LONG = "too_long"
VIOLATION_FORBIDDEN = "forbidden"
VIOLATION_STACKED = "stacked"
VIOLATION_NOT_SELECT = "not_select"


class ReadOnlySQLError(ValueError):
    """SQL violates the read-only policy and must not be executed.

    Carries the violation code (see VIOLATION_*) as its argument.
    """


def _strip_quoted(sql: str) -> str:
    """
    Remove string literals ('...') and quoted identifiers ("...").

    This prevents keywords and semicolons INSIDE strings / column names
    (e.g. WHERE name = 'DROP TABLE; x') from affecting the analysis.
    """
    s = re.sub(r"'[^']*'", "", sql)
    s = re.sub(r'"[^"]*"', "", s)
    return s


def read_only_violation(sql: str) -> str | None:
    """
    Check whether the SQL is a safe, single read-only query.

    Returns a violation code (VIOLATION_*), or None if the query is safe.
    """
    if not sql or not sql.strip():
        return VIOLATION_EMPTY

    if len(sql) > MAX_SQL_LENGTH:
        return VIOLATION_TOO_LONG

    stripped = _strip_quoted(sql)

    # 1) Forbidden operations anywhere in the query (including subqueries).
    if FORBIDDEN_PATTERN.search(stripped):
        return VIOLATION_FORBIDDEN

    # 2) Multiple statements (stacked queries). A ';' is only allowed as a
    #    trailing terminator - after stripping it, none must remain in the body.
    body = stripped.strip().rstrip(";").strip()
    if ";" in body:
        return VIOLATION_STACKED

    # 3) Allow read-only queries only: SELECT or a CTE (WITH ... SELECT).
    if not READ_ONLY_PREFIX.match(body):
        return VIOLATION_NOT_SELECT

    return None


def is_read_only(sql: str) -> bool:
    """True if the query is a safe, single read-only SELECT/CTE."""
    return read_only_violation(sql) is None


def assert_read_only(sql: str) -> None:
    """
    Raise ReadOnlySQLError(code) if the query is not a safe read-only query.
    Call this right before executing any SQL that came from the LLM or the user.
    """
    code = read_only_violation(sql)
    if code is not None:
        raise ReadOnlySQLError(code)
