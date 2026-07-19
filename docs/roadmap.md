# NLEx Product Roadmap

The project has concluded its development phase as part of the course. Below is the final delivered state and the history of product increments.

## MVP v1 (Sprint 1 - Delivered)
**Goal:** Functional end-to-end NL2SQL flow on a single database.
- **Natural Language Query:** Single input field for business questions.
- **LLM Orchestration:** SQL generation with context-aware clarification turns.
- **Browser Preview:** Interactive table showing initial result sets.
- **Excel Export:** Downloadable `.xlsx` files with professional auto-formatting.
- **Security:** Secure JWT-based authentication and user management.

## MVP v2 (Sprints 2 & 3 - Delivered)
**Goal:** Cross-database querying, enhanced usability, and admin features.
- **Trino Integration:** Support for distributed queries across multiple catalogs/schemas.
- **Connection Management:** UI-based configuration for adding and testing data sources.
- **Chat History:** Persistent history to revisit and re-run past queries.
- **Admin Dashboard:** Administrative controls for environment configuration.
- **Enhanced Accuracy:** Advanced prompt tuning for complex joins and aggregations.

## MVP v3 (Sprints 4 & 5 - Delivered Final Version)
**Goal:** Customer readiness, performance optimization, and transition.
- **Performance Optimization:** Excel export memory and speed improvements (`xlsxwriter`).
- **Organization & UX:** Admin user filtering, chat UI redesign (Chat folders deprecated).
- **Enterprise Readiness:** Resolution of critical deployment blockers (SPA routing, CORS, health checks).
- **Transition Material:** Comprehensive Customer Handover Documentation and local deployment guides.
- **Deprecations:** Query Templates, Template Sharing, and MCP integration were formally deprecated to focus on core stability.
