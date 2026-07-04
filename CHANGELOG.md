# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
