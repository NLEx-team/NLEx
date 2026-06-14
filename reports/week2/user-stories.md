# NLEx — User Stories

## User Roles / Personas

| Role | Description |
|------|-------------|
| **Business Analyst** | Primary user. Sales, marketing, finance, or product professional. Understands business questions deeply. Builds reports in Excel. SQL is a barrier, not a skillset. |
| **Data Team Analyst** | Secondary user. Member of the data team who can write SQL. Their problem is not writing queries — it is being interrupted to write queries for others. |
| **Data Engineer** | Setup role. Configures database connections via environment variables or config file before launching the Docker container. Verifies correct schema extraction at startup. |
| **System Administrator** | Manages the NLEx deployment: monitors health, reviews logs, manages user accounts. |

---

## Active User Stories

### MVP 1.0 — Single Database Queries

### US-01
**As a** Business Analyst,
**I want to** type an analytical question in plain natural language into a single input field,
**so that** I can request data without knowing SQL or the database schema.

- **Priority:** Must Have
- **Status:** Active

---

### US-02
**As a** Business Analyst,
**I want to** select a single database to query from a dropdown of human-readable names,
**so that** I can target the correct data source without remembering connection strings.

- **Priority:** Must Have
- **Status:** Active

---

### US-03
**As a** Business Analyst,
**I want to** receive a downloadable Excel file with my query results,
**so that** I can analyze, format, and share the data using familiar tools.

- **Priority:** Must Have
- **Status:** Active

---

### US-04
**As a** Business Analyst,
**I want to** see a preview of the first rows of my query result in the browser,
**so that** I can quickly verify the data looks correct before downloading.

- **Priority:** Must Have
- **Status:** Active

---

### US-05
**As a** Business Analyst,
**I want the system to** ask me clarifying questions when my request is ambiguous,
**so that** I get the exact data I intended instead of a wrong result based on an incorrect assumption.

- **Priority:** Must Have
- **Status:** Active

---

### US-06
**As a** Data Engineer,
**I want to** configure a single database connection through a configuration file or environment variables before starting the system,
**so that** the NLEx container connects to that database immediately upon launch without manual UI setup.

- **Priority:** Must Have
- **Status:** Active

---

### US-07
**As a** Data Engineer,
**I want to** see a health-check report at container startup showing whether the configured database connection succeeded or failed,
**so that** I can fix a misconfigured connection before users encounter errors.

- **Priority:** Must Have
- **Status:** Active

---

### US-08
**As a** Data Team Analyst,
**I want to** view the SQL that the system generated for a query,
**so that** I can validate its correctness and build trust in the system before recommending it to business users.

- **Priority:** Must Have
- **Status:** Active

---

### US-09
**As a** Business Analyst,
**I want to** see a history of my previous queries with their status and results,
**so that** I can re-run a past query or re-download an Excel file without re-typing the request.

- **Priority:** Should Have
- **Status:** Active

---

### US-10
**As a** Business Analyst,
**I want to** receive the Excel file with reasonable default formatting (number separators, date formats, auto-width columns, frozen headers),
**so that** the file is ready to use immediately without manual cleanup.

- **Priority:** Must Have
- **Status:** Active

---

### US-11
**As a** Business Analyst,
**I want to** write my query in Russian or English and have the system understand both,
**so that** I can use my preferred language.

- **Priority:** Should Have
- **Status:** Active

---

### MVP 2.0 — Cross-Database Queries & Templates

### US-12
**As a** Business Analyst,
**I want to** submit a single natural language question that requires data from multiple databases simultaneously,
**so that** I can get a unified answer without manually merging results from separate queries.

- **Priority:** Must Have (MVP 2.0)
- **Status:** Active

---

### US-13
**As a** Data Engineer,
**I want to** configure multiple database connections in the configuration file,
**so that** the system can query across all of them when a user request spans databases.

- **Priority:** Must Have (MVP 2.0)
- **Status:** Active

---

### US-14
**As a** Data Team Analyst,
**I want to** save a validated query as a reusable template with parameters (e.g., period, region),
**so that** business users can run it themselves without asking me every time.

- **Priority:** Should Have (MVP 2.0)
- **Status:** Active

---

### US-15
**As a** Business Analyst,
**I want to** run a saved template by filling in the required parameters,
**so that** I can get regular reports without typing the full question each time.

- **Priority:** Should Have (MVP 2.0)
- **Status:** Active

---

### US-16
**As a** Data Team Analyst,
**I want to** share a template I created with specific business users,
**so that** they can run validated queries without my further involvement.

- **Priority:** Could Have (MVP 2.0)
- **Status:** Active

---

### US-17
**As a** System Administrator,
**I want to** see basic usage statistics (number of queries per day, success rate, average execution time),
**so that** I can monitor system health and justify the cost of the LLM API.

- **Priority:** Could Have
- **Status:** Active

---

## Removed User Stories

None at this stage. All documented stories remain active as legitimate candidate requirements.

---

## MoSCoW Summary

| Priority | Stories | Count |
|----------|---------|-------|
| **Must Have** | US-01, US-02, US-03, US-04, US-05, US-06, US-07, US-08, US-10, US-12, US-13 | 11 |
| **Should Have** | US-09, US-11, US-14, US-15 | 4 |
| **Could Have** | US-16, US-17 | 2 |
| **Won't Have** | — | 0 |

---

## MVP Version Breakdown

| Version | Stories |
|---------|---------|
| **MVP 1.0** | US-01, US-02, US-03, US-04, US-05, US-06, US-07, US-08, US-10 (9 stories) |
| **MVP 2.0** | US-12, US-13, US-14, US-15, US-16 (5 stories) |
| **Shared** | US-09, US-11, US-17 (3 stories) |

---

## Initial Proposed MVP v1 Scope

The following Must Have stories form the minimal viable product to demonstrate the core value proposition: natural language query against a single database → clarification if needed → Excel download.

| ID | Story |
|----|-------|
| US-01 | Natural language query input |
| US-02 | Single database selector |
| US-03 | Excel file download |
| US-04 | Result preview in browser |
| US-05 | Clarification dialogue for ambiguous queries |
| US-06 | Configuration-file-based single database connection |
| US-07 | Startup health-check for database connection |
| US-08 | View generated SQL |
| US-10 | Excel auto-formatting |
