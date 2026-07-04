# Quality Requirement Tests

This document describes the automated Quality Requirement Tests (QRTs) implemented to verify the quality requirements defined in `quality-requirements.md`.

## Automated Tests

### QRT for QR-001 (Performance Efficiency)
* **Test Name**: `test_performance_efficiency_query_time`
* **Location**: `backend/tests/test_workflow_e2e.py`
* **Description**: Submits an end-to-end natural language request to a mock database with <= 50 tables. Asserts that the response (SQL + preview data) is returned in under 15 seconds.
* **Automation Method**: Runs via Pytest in the CI test job (`docker compose --profile test up backend-test`).

### QRT for QR-002 (Security - Authenticity)
* **Test Name**: `test_unauthenticated_access_rejected`
* **Location**: `backend/tests/test_auth_api.py`
* **Description**: Iterates through a representative list of protected API endpoints (e.g., `/api/v1/users/me`, `/api/v1/databases`) and makes requests without a JWT token. Asserts that every response returns a 401 status code.
* **Automation Method**: Runs via Pytest in the CI test job.

### QRT for QR-003 (Usability - Error Protection)
* **Test Name**: `test_orchestrator_clarification_path`
* **Location**: `backend/tests/test_orchestrator_service.py`
* **Description**: Feeds a deliberately ambiguous prompt to the orchestrator service state machine. Asserts that the orchestrator transitions to the `CLARIFICATION_REQUIRED` state and yields clarify options instead of proceeding to `EXECUTION`.
* **Automation Method**: Runs via Pytest in the CI test job.
