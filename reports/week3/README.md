# NLEx — Week 3 Report

## 1. Project Overview
**Project Name:** NLEx (Natural Language to SQL)
**Description:** A service that translates natural language requests into SQL queries for distributed databases via Trino.
**License:** [MIT](../../LICENSE)

---

## 2. Product Backlog

This backlog contains the prioritized items for the NLEx project, migrated and refined from Week 2 User Stories.

| PBI ID | Title | Type | MoSCoW | Points | Status | Sprint | Linked US |
|:---:|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **PBI-001** | NL query input field in UI | Feature | Must Have | 5 | To Do | Sprint 1 | US-01 |
| **PBI-002** | Backend endpoint for prompt processing & LLM integration | Feature | Must Have | 8 | To Do | Sprint 1 | US-01 |
| **PBI-003** | Sidebar database selection dropdown | Feature | Must Have | 3 | To Do | Sprint 1 | US-02 |
| **PBI-004** | Excel export service with auto-formatting | Feature | Must Have | 8 | To Do | Sprint 1 | US-03, US-10 |
| **PBI-005** | Frontend result preview table | Feature | Must Have | 5 | To Do | Sprint 1 | US-04 |
| **PBI-006** | Clarification logic in LLM prompt & Backend handler | Feature | Must Have | 8 | To Do | Sprint 1 | US-05 |
| **PBI-007** | UI support for clarification turns (chat bubbles) | Feature | Must Have | 5 | To Do | Sprint 1 | US-05 |
| **PBI-011** | Replace mock Auth with real JWT/DB authentication | Tech | Must Have | 8 | To Do | Sprint 1 | — |
| **PBI-008** | Persistent database connection management (PostgreSQL) | Feature | Must Have | 5 | To Do | Sprint 1 | US-06 |
| **PBI-009** | API health check and startup connection validation | Feature | Must Have | 3 | To Do | Sprint 1 | US-07 |
| **PBI-010** | Collapsible SQL preview component in UI | Feature | Must Have | 3 | To Do | Sprint 1 | US-08 |
| **PBI-015** | Frontend Error boundaries & user-friendly error messages | Tech | Must Have | 3 | To Do | Sprint 1 | — |
| **PBI-012** | Full Trino-SQL Gen Pipeline Integration | Tech | Must Have | 13 | To Do | MVP v2 | US-12 |
| **PBI-016** | Multiple database connections via config | Feature | Must Have | 5 | To Do | MVP v2 | US-13 |
| **PBI-013** | Chat history sidebar and persistence | Feature | Should Have | 8 | To Do | MVP v2 | US-09 |
| **PBI-014** | Prompt tuning for bilingual (RU/EN) support | Feature | Should Have | 5 | To Do | MVP v2 | US-11 |
| **PBI-017** | Save validated query as reusable template | Feature | Should Have | 8 | To Do | MVP v2 | US-14 |
| **PBI-018** | Run a saved template with parameters | Feature | Should Have | 5 | To Do | MVP v2 | US-15 |

### PBI Details & Acceptance Criteria

#### PBI-001: NL query input field in UI
- **Description:** Implement a prominent natural language input field on the main chat screen as per the Figma prototype.
- **Acceptance Criteria:**
  1. Input field supports multi-line text entry.
  2. Pressing "Enter" (or clicking the send icon) triggers the query submission.
  3. Field is cleared upon successful submission.

#### PBI-002: Backend endpoint for prompt processing & LLM integration
- **Description:** Develop the `POST /chats/{chat_id}/prompt` endpoint to send user queries to the LLM and return generated SQL.
- **Acceptance Criteria:**
  1. Endpoint accepts a natural language string.
  2. Successfully calls the LLM service and receives a SQL response.
  3. Returns a JSON response containing the generated SQL and a query ID.

#### PBI-003: Sidebar database selection dropdown
- **Description:** Create a sidebar component that allows users to select which database they want to query.
- **Acceptance Criteria:**
  1. Dropdown displays human-readable aliases of configured databases.
  2. Selecting a database updates the active context for the current chat session.
  3. Selection is persisted across page refreshes for the active chat.

#### PBI-004: Excel export service with auto-formatting
- **Description:** Implement the service to convert query result DataFrames into downloadable `.xlsx` files with professional formatting.
- **Acceptance Criteria:**
  1. Columns are automatically resized to fit content.
  2. Header row is frozen and bolded.
  3. Date and numeric columns use localized formatting (separators, etc.).

#### PBI-005: Frontend result preview table
- **Description:** A browser-based table to display the first 20 rows of the query results.
- **Acceptance Criteria:**
  1. Table displays correctly with scrollbars for large datasets.
  2. Column headers are visible and clear.
  3. "Download full result" button is visible alongside the preview.

#### PBI-006: Clarification logic in LLM prompt & Backend handler
- **Description:** Update the prompt template and backend logic to detect ambiguity and ask clarifying questions.
- **Acceptance Criteria:**
  1. System detects when a query could map to multiple schema elements.
  2. System returns a specific "clarification_needed" status instead of guessing.
  3. Backend tracks the state of the conversation to handle follow-up answers.

#### PBI-007: UI support for clarification turns (chat bubbles)
- **Description:** UI components to render LLM questions and allow user responses within the chat.
- **Acceptance Criteria:**
  1. Questions from the system appear in a distinct "Assistant" bubble.
  2. Users can type a text response or select from suggested options if provided.
  3. The chat history correctly scrolls to the latest interaction.

#### PBI-011: Replace mock Auth with real JWT/DB authentication
- **Description:** Secure the application using industry-standard JWT tokens and a PostgreSQL-backed user store.
- **Acceptance Criteria:**
  1. Users can register and login with persistent credentials.
  2. API endpoints return 401 Unauthorized for invalid/missing tokens.
  3. Password hashing is implemented using bcrypt.

#### PBI-008: Persistent database connection management (PostgreSQL)
- **Description:** Move from mock connections to a database-backed storage for connection strings and metadata.
- **Acceptance Criteria:**
  1. Connection details (host, port, user, etc.) are saved in the internal DB.
  2. Sensitive fields (passwords) are encrypted at rest.
  3. Users can add, edit, or delete connections via the UI.

#### PBI-009: API health check and startup connection validation
- **Description:** A robust startup check that verifies connectivity to all configured data sources.
- **Acceptance Criteria:**
  1. Application logs a clear status for each connection on startup.
  2. `/health` endpoint returns a detailed report on downstream dependencies.
  3. Fails fast if a critical system database is unreachable.

#### PBI-010: Collapsible SQL preview component in UI
- **Description:** A component that shows the generated SQL to technical users while remaining hidden/collapsed by default.
- **Acceptance Criteria:**
  1. Users can toggle the visibility of the SQL code.
  2. SQL is syntax-highlighted for readability.
  3. Includes a "Copy to clipboard" button.

#### PBI-015: Frontend Error boundaries & user-friendly error messages
- **Description:** Global error handling to prevent app crashes and provide helpful feedback.
- **Acceptance Criteria:**
  1. Failed API calls display a non-technical error message to the user.
  2. Component-level crashes are caught by React Error Boundaries.
  3. Error logs are sent to the backend/monitoring service (if applicable).

#### PBI-012: Full Trino-SQL Gen Pipeline Integration
- **Description:** Connect the core SQL generation logic to the Trino distributed query engine for actual execution.
- **Acceptance Criteria:**
  1. System can route queries to Trino.
  2. Handles Trino-specific SQL syntax correctly.
  3. Returns execution errors from Trino in a structured format.

#### PBI-013: Chat history sidebar and persistence
- **Description:** Allow users to view and revisit their previous chat sessions.
- **Acceptance Criteria:**
  1. Sidebar lists past chats by name/date.
  2. Clicking a chat restores its history and state.
  3. Users can rename or delete old chats.

#### PBI-014: Prompt tuning for bilingual (RU/EN) support
- **Description:** Refine the LLM system prompts to handle Russian and English inputs with equal accuracy.
- **Acceptance Criteria:**
  1. System correctly identifies intent in both languages.
  2. SQL is generated correctly regardless of input language.
  3. Clarification questions are delivered in the same language as the user's prompt.

#### PBI-016: Multiple database connections via config
- **Description:** Enable the system to load and manage multiple data source configurations simultaneously.
- **Acceptance Criteria:**
  1. System can parse a YAML/JSON config file containing multiple database definitions.
  2. Each connection is independently validated and registered.
  3. Logs provide clear individual status reports for each configured source.

#### PBI-017: Save validated query as reusable template
- **Description:** Allow technical users to save a successful SQL query as a template.
- **Acceptance Criteria:**
  1. Users can click "Save as Template" after a successful query execution.
  2. The system allows naming the template and defining parameters.
  3. Templates are stored in the internal database and visible in a library.

#### PBI-018: Run a saved template with parameters
- **Description:** Enable business users to select a pre-validated template and provide required inputs.
- **Acceptance Criteria:**
  1. The UI displays a form with input fields for all parameters defined in the template.
  2. Successfully substitutes user inputs into the SQL query before execution.
  3. Returns the result set and enables Excel export.

---

## 3. Sprint Backlog (Sprint 1: MVP v1)

**Sprint Goal:** Deliver a functional end-to-end NL2SQL flow on a single database, including query preview, clarification, and Excel download with formatting.

**Total Story Points:** 61

| PBI ID | Title | MoSCoW | Points | Status | Assignee |
|:---:|---|:---:|:---:|:---:|:---:|
| **PBI-001** | NL query input field in UI | Must Have | 5 | To Do | — |
| **PBI-002** | Backend endpoint for prompt processing & LLM integration | Must Have | 8 | To Do | — |
| **PBI-003** | Sidebar database selection dropdown | Must Have | 3 | To Do | — |
| **PBI-004** | Excel export service with auto-formatting | Must Have | 8 | To Do | — |
| **PBI-005** | Frontend result preview table | Must Have | 5 | To Do | — |
| **PBI-006** | Clarification logic in LLM prompt & Backend handler | Must Have | 8 | To Do | — |
| **PBI-007** | UI support for clarification turns (chat bubbles) | Must Have | 5 | To Do | — |
| **PBI-011** | Replace mock Auth with real JWT/DB authentication | Must Have | 8 | To Do | — |
| **PBI-008** | Persistent database connection management (PostgreSQL) | Must Have | 5 | To Do | — |
| **PBI-009** | API health check and startup connection validation | Must Have | 3 | To Do | — |
| **PBI-010** | Collapsible SQL preview component in UI | Must Have | 3 | To Do | — |
| **PBI-015** | Frontend Error boundaries & user-friendly error messages | Must Have | 3 | To Do | — |

---

## 4. MVP v1 Scope Details
The scope for MVP v1 (Sprint 1) targets the core value proposition defined in the Week 2 reports. It covers the complete user journey from authentication and connection setup to natural language querying and result export.

---

## 5. Artifact Links
- **Historical Week 2 Report:** [reports/week2/README.md](../week2/README.md)
- **Roadmap:** [roadmap.md](roadmap.md)
- **Definition of Done:** [definition-of-done.md](definition-of-done.md)
- **Reflection:** [reflection.md](reflection.md)
- **Retrospective:** [retrospective.md](retrospective.md)
- **LLM Report:** [llm-report.md](llm-report.md)

