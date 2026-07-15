# Quality Requirements

## Table of Contents
- [Quality Model](#quality-model)
- [QR-001: Performance Efficiency — Time Behaviour](#qr-001-performance-efficiency--time-behaviour)
- [QR-002: Security — Authenticity](#qr-002-security--authenticity)
- [QR-003: Usability — User Error Protection](#qr-003-usability--user-error-protection)

## Quality Model
We use **ISO/IEC 25010** as the quality model framework. Three quality requirements were defined, each targeting a different sub-characteristic.

### QR-001: Performance Efficiency — Time Behaviour
* **Rationale**: Users expect interactive response times when querying databases naturally. Long wait times disrupt the business analyst's workflow.
* **Scenario**: When a business analyst submits a natural language query mapped to a single table on a database with <= 50 tables, the system must return the SQL query and data preview within 15 seconds under normal load.
* **QRT Linkage**: Verified by `test_performance_efficiency_query_time` in `test_workflow_e2e.py`.
* **ADR Linkage**: Addressed by [ADR-001: Trino for Distributed Queries](architecture/adr/001-trino-for-distributed-queries.md).

### QR-002: Security — Authenticity
* **Rationale**: The system connects to sensitive corporate databases. We must ensure only authenticated users can access the system's API to prevent unauthorized data exfiltration.
* **Scenario**: When an external or internal client attempts to access any API endpoint (except `/auth/register` and `/auth/login`) without a valid JWT token, the system must reject the request with an HTTP 401 Unauthorized status.
* **QRT Linkage**: Verified by `test_unauthenticated_access_rejected` in `test_auth_api.py`.
* **ADR Linkage**: Addressed by [ADR-002: JWT Authentication Middleware](architecture/adr/002-jwt-authentication-middleware.md).

### QR-003: Usability — User Error Protection
* **Rationale**: Natural language is inherently ambiguous. Translating an ambiguous request directly into SQL could yield incorrect business insights, which is worse than failing to generate a query.
* **Scenario**: When a user submits an ambiguous query (e.g., matching multiple columns like 'revenue' and 'total_revenue'), the system must detect the ambiguity and return a clarification dialogue instead of executing potentially incorrect SQL.
* **QRT Linkage**: Verified by `test_orchestrator_clarification_path` in `test_orchestrator_service.py`.
* **ADR Linkage**: Addressed by [ADR-003: Orchestrator State Machine for Ambiguity](architecture/adr/003-orchestrator-state-machine-for-ambiguity.md).
