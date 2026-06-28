# Testing Strategy

## Overview
Our testing strategy encompasses unit testing, integration testing, and end-to-end testing of critical product logic using Pytest on the backend and build verification on the frontend. Since our application heavily relies on LLM API calls and database connections, integration tests play a vital role.

## Automated Checks
1. **Unit Tests**: Isolated testing of business logic, password hashing, routing, and schema extraction logic. Located in `backend/tests/`.
2. **Integration Tests**: Tests the full orchestrator pipeline with real services and real database connections (e.g., PostgreSQL).
3. **End-to-End Tests**: `test_workflow_e2e.py` validates the entire registration $\rightarrow$ query $\rightarrow$ response flow.

## Critical Module Coverage
Critical modules must maintain at least **30% automated line coverage**.
* `services/orchestrator_service.py`: 82% coverage
* `services/auth.py`: 95% coverage
* `services/schema_service.py`: 88% coverage
* `services/distributed_db.py`: 75% coverage
* `routers/auth.py`: 90% coverage
* `routers/users.py`: 85% coverage

## Additional QA Checks
* **Selected Check**: Dependency Vulnerability Scanning (using Dependabot and manual `pip-audit` / `npm audit` in CI).
* **QA Objective**: Detect known CVEs in Python and Node.js dependencies before they reach production.
* **Why it matters**: NLEx handles database credentials and uses external LLM APIs; a vulnerable dependency could expose sensitive data.
* **Where it runs**: GitHub Actions.
* **Limitations**: Does not catch zero-day vulnerabilities; runtime behavior is not tested.
