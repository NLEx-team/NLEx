# NLEx Product Roadmap

## MVP v1 (Sprint 1 - Completed)
**Goal:** Functional end-to-end NL2SQL flow on a single database.
- **Natural Language Query:** Single input field for business questions.
- **LLM Orchestration:** SQL generation with context-aware clarification turns.
- **Browser Preview:** Interactive table showing initial result sets.
- **Security:** Secure JWT-based authentication and user management.

## MVP v2 (Sprint 2/3 - Current)
**Goal:** Cross-database querying, Admin controls, and enhanced usability.
- **Cross-Database Integration:** Support for distributed queries across multiple catalogs/schemas using Trino.
- **Admin Panel:** Administrative interface for configuring environments and managing users.
- **Chat History:** Persistent chat history to revisit and continue past sessions.

## MVP v3 (Sprint 4 - Planned)
**Goal:** NoSQL Support and Advanced Usage Controls.
- **NoSQL Databases:** Support for MongoDB and MinIO connections.
- **Direct SQL Restrictions:** Implementing security restrictions on executing queries directly in SQL.
- **Account Blocking:** Ability to block user access via the Admin Panel.
- **Advanced Analytics:** Filters in analytics tables and accurate analytics for short periods (day/week).

*(Note: All previously planned template-related features have been deprecated due to a change in product vision).*
