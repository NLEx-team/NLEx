# NLEx — Week 3 Report

## 1. Project Overview
* **Project Name:** NLEx (Natural Language to SQL)
* **Description:** A service that translates natural language requests into SQL queries for distributed databases via Trino.
* **License:** [MIT](../../LICENSE)

---

## 2. Customer Feedback Alignment (Week 2 Updates)
Due to the customer's sudden emergency relocation to Moscow, a full end-of-sprint review was conducted virtually in the middle of the sprint cycle. 
* **Addressed Feedback:** The customer prioritized baseline core architecture (FastAPI processing pipeline and schema inspection infrastructure) over immediate export layouts.
* **Pre-MVP v1.0 Delivery:** We demonstrated a mid-sprint functional prototype. The natural language engine, Trino configuration mappings, and core chat layouts were successfully showcased.
* **Scope Exclusions:** As agreed during this synchronization, automated Excel extraction processes and full frontend-to-backend data rendering components were omitted from this increment due to mid-sprint shifts. The customer expressed high satisfaction with the core system stability and architectural progression.

---

## 3. Product Backlog Metrics & Methodology
* **Total Product Backlog Size:** `[Insert Total Story Points of all 18 PBIs here, e.g., 95]` Story Points
* **Total Current Sprint Size:** 61 Story Points
* **Backlog Management & Tracking Rules:**
  * **PBI Decompositions:** User stories are converted into technical Product Backlog Items (PBIs) and annotated with strict, testable acceptance criteria before execution.
  * **Prioritization:** Managed via a MoSCoW schema mapped to custom tracking fields within our issue tracker.
  * **Milestone Execution:** The Sprint 1 Milestone serves as our authoritative scope boundary. Items not included in the active delivery phase are retained in the Backlog and scheduled explicitly for subsequent iterations (e.g., MVP v2).

---

## 4. Product Backlog

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
| **PBI-009** | API health check and startup connection validation | Tech | Must Have | 3 | To Do | Sprint 1 | US-07 |
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
* **Description:** Implement a prominent natural language input field on the main chat screen as per the Figma prototype.
* **Acceptance Criteria:**
  1. Input field supports multi-line text entry.
  2. Pressing "Enter" (or clicking the send icon) triggers the query submission.
  3. Field is cleared upon successful submission.

#### PBI-002: Backend endpoint for prompt processing & LLM integration
* **Description:** Develop the `POST /chats/{chat_id}/prompt` endpoint to send user queries to the LLM and return generated SQL.
* **Acceptance Criteria:**
  1. Endpoint accepts a natural language string.
  2. Successfully calls the LLM service and receives a SQL response.
  3. Returns a JSON response containing the generated SQL and a query ID.

#### PBI-003: Sidebar database selection dropdown
* **Description:** Create a sidebar component that allows users to select which database they want to query.
* **Acceptance Criteria:**
  1. Dropdown displays human-readable aliases of configured databases.
  2. Selecting a database updates the active context for the current chat session.
  3. Selection is persisted across page refreshes for the active chat.

#### PBI-004: Excel export service with auto-formatting
* **Description:** Implement the service to convert query result DataFrames into downloadable `.xlsx` files with professional formatting.
* **Acceptance Criteria:**
  1. Columns are automatically resized to fit content.
  2. Header row is frozen and bolded.
  3. Date and numeric columns use localized formatting (separators, etc.).

#### PBI-005: Frontend result preview table
* **Description:** A browser-based table to display the first 20 rows of the query results.
* **Acceptance Criteria:**
  1. Table displays correctly with scrollbars for large datasets.
  2. Column headers are visible and clear.
  3. "Download full result" button is visible alongside the preview.

#### PBI-006: Clarification logic in LLM prompt & Backend handler
* **Description:** Update the prompt template and backend logic to detect ambiguity and ask clarifying questions.
* **Acceptance Criteria:**
  1. System detects when a query could map to multiple schema elements.
  2. System returns a specific "clarification_needed" status instead of guessing.
  3. Backend tracks the state of the conversation to handle follow-up answers.

#### PBI-007: UI support for clarification turns (chat bubbles)
* **Description:** UI components to render LLM questions and allow user responses within the chat.
* **Acceptance Criteria:**
  1. Questions from the system appear in a distinct "Assistant" bubble.
  2. Users can type a text response or select from suggested options if provided.
  3. The chat history correctly scrolls to the latest interaction.

#### PBI-011: Replace mock Auth with real JWT/DB authentication
* **Description:** Secure the application using industry-standard JWT tokens and a PostgreSQL-backed user store.
* **Acceptance Criteria:**
  1. Users can register and login with persistent credentials.
  2. API endpoints return 401 Unauthorized for invalid/missing tokens.
  3. Password hashing is implemented using bcrypt.

#### PBI-008: Persistent database connection management (PostgreSQL)
* **Description:** Move from mock connections to a database-backed storage for connection strings and metadata.
* **Acceptance Criteria:**
  1. Connection details (host, port, user, etc.) are saved in the internal DB.
  2. Sensitive fields (passwords) are encrypted at rest.
  3. Users can add, edit, or delete connections via the UI.

#### PBI-009: API health check and startup connection validation
* **Description:** A robust startup check that verifies connectivity to all configured data sources.
* **Acceptance Criteria:**
  1. Application logs a clear status for each connection on startup.
  2. `/health` endpoint returns a detailed report on downstream dependencies.
  3. Fails fast if a critical system database is unreachable.

#### PBI-010: Collapsible SQL preview component in UI
* **Description:** A component that shows the generated SQL to technical users while remaining hidden/collapsed by default.
* **Acceptance Criteria:**
  1. Users can toggle the visibility of the SQL code.
  2. SQL is syntax-highlighted for readability.
  3. Includes a "Copy to clipboard" button.

#### PBI-015: Frontend Error boundaries & user-friendly error messages
* **Description:** Global error handling to prevent app crashes and provide helpful feedback.
* **Acceptance Criteria:**
  1. Failed API calls display a non-technical error message to the user.
  2. Component-level crashes are caught by React Error Boundaries.
  3. Error logs are sent to the backend/monitoring service (if applicable).

---

## 5. Sprint Backlog & Operational Plan (Sprint 1)
* **Sprint Goal:** Deliver a functional end-to-end NL2SQL flow on a single database, including query preview, clarification, and Excel download with formatting.
* **Sprint Milestone Containers:** Tracked dynamically using GitHub Milestones.

### Team Contribution Traceability Blueprint
| Team Member Name | GitHub Username | Assigned PBIs | Created PRs | Review / Comments Left |
|---|---|---|---|---|
| `[Developer 1 Name]` | `[Username 1]` | PBI-001, PBI-003 | `[PR Link 1]` | `[PR Link 2 Code Review Comment]` |
| `[Developer 2 Name]` | `[Username 2]` | PBI-002, PBI-006 | `[PR Link 2]` | `[PR Link 1 Code Review Comment]` |
| `[Developer 3 Name]` | `[Username 3]` | PBI-011, PBI-008 | `[PR Link 3]` | `[PR Link 4 Code Review Comment]` |
| `[Developer 4 Name]` | `[Username 4]` | PBI-004, PBI-005 | `[PR Link 4]` | `[PR Link 3 Code Review Comment]` |

---

## 6. Project Artifact Mappings & Verification Links

### Deployment & Access Context
* **Live Deployment Target:** [https://nlex.tech](https://nlex.tech)
* **Deployment Instructions:** Accessible via the core infrastructure directory at [NLEx App Root Setup](../../README.md)
* **Source Repository Address:** [https://github.com/NLEx-team/NLEx](https://github.com/NLEx-team/NLEx) (Tracking branch: `main`)
* **Public Video Walkthrough Demonstration:** https://drive.google.com/file/d/1lYX10NJpp_ggTlxNltmux9hzM-Sh2hQz/view?usp=sharing

### Configuration & Base Templates
* **Issue Templates Directory:** [GitHub Issue Templates](../../.github/ISSUE_TEMPLATE/) *(or dynamic system tracking components)*
* **Extended PR/MR Template File:** [Pull Request Template](../week2/PR_Template.md)
* **Semantic Version Release Mapping:** [NLEx Release v1.0.0-pre](https://github.com/NLEx-team/NLEx/releases)

### Execution Traceability Logs
* **Historical User Stories Register (Week 2):** [reports/week2/user-stories.md](../week2/user-stories.md)
* **Current Active User Stories Register (Week 3 Mapping Index):** [docs/user-stories.md](../../docs/user-stories.md)
* **Shared Process Specification Guide:** [Process_Requirements.md](../../Process_Requirements.md)
* **Product Vision & Roadmap Plan:** [roadmap.md](roadmap.md)
* **Definition of Done Document:** [definition-of-done.md](definition-of-done.md)
* **Sprint Retrospective Evaluation:** [retrospective.md](retrospective.md)
* **Sprint Performance Reflection:** [reflection.md](reflection.md)
* **LLM Core Usage Documentation:** [llm-report.md](llm-report.md)

---

## 7. Operational Board & Environment Evidence (Screenshots)

### A. Product Backlog Overview View
![Product Backlog Board](images/product_backlog_board.png)

### B. Current Sprint Backlog Board
![Sprint Backlog View](images/sprint_backlog_board.png)

### C. Active Sprint Milestone Metrics & Boundaries
![Sprint Milestone View](images/sprint_milestone.png)

### D. MVP Version Field Grouping Layout
![MVP Field Grouped View](images/mvp_version_view.png)

### E. Semantic Versioning Release Documentation Page
![SemVer Release Version Page](images/semver_release.png)

### F. Functional UI Live Demonstration Screen
![Live Application UI Workspace](images/live_mvp_application.png)

### G. Issue-Linked Peer Code Review & Verification Event
![Reviewed Issue Linked Pull Request Workflow](images/reviewed_pull_request.png)
