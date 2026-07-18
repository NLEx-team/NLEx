# Software Architecture

This document describes the software architecture of NLEx using the C4 model concepts to provide different reasoning angles: Static View, Dynamic View, and Deployment View.

## Architecture and Quality Requirements

The architecture is designed to support the system's core quality requirements (QRs):
- **Performance Efficiency (QR-001)**: Supported by using Trino as a distributed query engine to federate and query multiple databases efficiently without heavy ETL.
- **Security - Authenticity (QR-002)**: Ensured by a centralized FastAPI dependency middleware that validates JWT tokens for all protected endpoints.
- **Usability - User Error Protection (QR-003)**: Achieved through an Orchestrator State Machine that pauses execution when an ambiguous query is detected and asks the user for clarification.

### Architecture Decision Records (ADRs)

Key architectural decisions are documented in ADRs to preserve the rationale behind them:
- [ADR-001: Trino for Distributed Queries](adr/001-trino-for-distributed-queries.md) (Addresses QR-001)
- [ADR-002: JWT Authentication Middleware](adr/002-jwt-authentication-middleware.md) (Addresses QR-002)
- [ADR-003: Orchestrator State Machine for Ambiguity](adr/003-orchestrator-state-machine-for-ambiguity.md) (Addresses QR-003)

## Static View

The static view shows the internal components of NLEx and how they interact with external systems. 

**[Component Diagram Source](static-view/component-diagram.md)**

### Analysis
- **Coupling and Cohesion**: The system uses a loosely coupled architecture. The frontend SPA is decoupled from the backend API. The backend orchestrator is highly cohesive, managing state transitions internally while delegating database connections to Trino and AI inferences to the LLM service.
- **Maintainability**: Using FastAPI for the backend allows for easy route separation and dependency injection. Trino abstracts the underlying databases, meaning adding a new database (e.g., Oracle) only requires a Trino connector configuration, not core backend changes.
- **Quality Requirements**: This structure supports QR-001 by offloading query federation to Trino, and QR-002 by forcing all API traffic through the FastAPI routers where JWT validation occurs.

## Dynamic View

The dynamic view maps out the complex multi-component workflow of executing a natural language query that requires clarification.

**[Sequence Diagram Source](dynamic-view/sequence-diagram.md)**

### Analysis
- **Scenario**: A user submits an ambiguous natural language query. The system detects the ambiguity, requests clarification, waits for the user's choice, and finally executes the corrected query.
- **Importance**: This is the core value proposition of NLEx. Direct execution of ambiguous queries would lead to incorrect business insights.
- **Reasoning**: This diagram helps reason about QR-003 (Usability - User Error Protection). It shows the integration boundaries between the Frontend, the Orchestrator, the LLM (for ambiguity detection), and Trino (for final execution).

## Deployment View

The deployment view shows the runtime services, stateful infrastructure, and network boundaries using Docker Compose.

**[Deployment Diagram Source](deployment-view/deployment-diagram.md)**

### Analysis
- **Why this model**: A containerized Docker Compose deployment was chosen for portability, ease of local development, and straightforward production hosting. It isolates the backend, frontend, Trino, and internal Postgres instances into a single virtual network.
- **Support and Constraints**: It supports rapid deployment and ensures environment consistency. However, it constrains horizontal scaling compared to a Kubernetes cluster. For MVP v2, this scale is sufficient and reduces operational complexity.
- **Deployment Considerations**: When operating it, `.env.secret` must be carefully managed. External access is routed through the frontend Nginx reverse proxy, protecting backend services from direct public exposure.
