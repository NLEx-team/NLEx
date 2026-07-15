# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v3.0.0] - 2026-07-15
### Added
- Excel export performance improvements replacing openpyxl with xlsxwriter (PBI-033).
- Rich download animation for Excel export.
- Per-service configuration documentation.

### Deprecated
- Per-service deployment documentation for Kubernetes (PBI-035) is officially deprecated.
- MCP integration for database-specific query optimization (PBI-039) is officially deprecated.
- Chat folder organization (PBI-031) is officially deprecated and removed.

### Fixed
- Deployment blockers for customer setup (nginx SPA routing, environment variables, backend health checks, CORS) (PBI-119).
- UI bugs and LLM configuration cleanup.
- Excel exported data cells formatting.

## [v2.1.0] - 2026-07-12
### Added
- Chat folder organization, allowing users to group related chats (PBI-031).
- Admin user table filtering and sorting by email, name, registration date, and query count (PBI-030).
- Customer handover documentation for transitioning product deployment (PBI-037).
- Architecture diagram in the hosted documentation (PBI-038).
- Initial per-service deployment documentation for Kubernetes (PBI-035).
- Stable release-candidate branch for independent customer testing (PBI-036).

### Changed
- Minimalist chat UI redesign inspired by modern chatbot UX patterns (PBI-032).

### Fixed
- UI translation inconsistencies (e.g., untranslated words like "successfully" in Russian UI) (PBI-034).

## [v2.0.0] - 2026-07-05
### Added
- Cross-database request capabilities (query multiple database targets).
- Admin Panel for administrative controls and environment configuration.
- Persistent history of past requests in the chat interface.

### Deprecated
- All saved templates and template-sharing functionality have been deprecated and removed from the roadmap based on changing product vision.

## [v1.2.0] - 2026-06-28
### Added
- Oracle DBMS connector for Trino (PBI-032).
- Explicit database selector control before query submission (PBI-019).
- "Other" hint button on clarification option sets (PBI-022).
- Large-result file export to `.xlsx` (PBI-024).
- DBMS type selector in "Add Database" admin form (PBI-025).
- "Check Connection" button for regular users (PBI-028).
- Database server latency indicator (PBI-029).
- Comprehensive local deployment guide (PBI-033).

### Changed
- Clicking clarification options now sends as a separate message instead of overwriting the user draft (PBI-021).
- Deferred chat title synthesis to wait for multi-message context (PBI-023).
- Adjusted Role-based UI element visibility to hide admin-only controls from standard users (PBI-027).

### Fixed
- Input field blocking issue during response generation (PBI-020).
- Password requirements validation & feedback on registration form (PBI-026).

## [v1.0.0] - 2026-06-14
### Added
- Initial MVP release.
- Natural language query input field.
- Result preview table and SQL preview component.
- Clarification logic and UI support for clarification bubbles.
- Persistent database connection management (PostgreSQL).
