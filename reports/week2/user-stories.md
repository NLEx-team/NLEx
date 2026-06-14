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

## US-01: Natural language query input

**Requirement status:** Active
**MoSCoW priority:** Must Have

As a Business Analyst,
I want to type an analytical question in plain natural language into a single input field,
so that I can request data without knowing SQL or the database schema.

### Notes and constraints

- Primary entry point of the product. Defines the chat input on the main screen of the Figma prototype.
- Targeted at MVP v1. Russian and English inputs must be accepted (see US-11).

---

## US-02: Single database selector

**Requirement status:** Active
**MoSCoW priority:** Must Have

As a Business Analyst,
I want to select a single database to query from a dropdown of human-readable names,
so that I can target the correct data source without remembering connection strings.

### Notes and constraints

- Human-readable alias ("Title") was explicitly requested by the customer during the Week 2 meeting.
- Selection happens in the sidebar / chat header; databases are managed in a dedicated settings tab, not per chat.
- Targeted at MVP v1.

---

## US-03: Excel file download

**Requirement status:** Active
**MoSCoW priority:** Must Have

As a Business Analyst,
I want to receive a downloadable Excel file with my query results,
so that I can analyze, format, and share the data using familiar tools.

### Notes and constraints

- Output is `.xlsx`. Default formatting requirements are covered separately by US-10.
- Targeted at MVP v1.

---

## US-04: Result preview in browser

**Requirement status:** Active
**MoSCoW priority:** Must Have

As a Business Analyst,
I want to see a preview of the first rows of my query result in the browser,
so that I can quickly verify the data looks correct before downloading.

### Notes and constraints

- Preview shows a limited number of rows (e.g., first 20) and basic key metrics.
- Implemented as the "Reply Preview" component in the Figma prototype.
- Targeted at MVP v1.

---

## US-05: Clarification dialogue for ambiguous queries

**Requirement status:** Active
**MoSCoW priority:** Must Have

As a Business Analyst,
I want the system to ask me clarifying questions when my request is ambiguous,
so that I get the exact data I intended instead of a wrong result based on an incorrect assumption.

### Notes and constraints

- Clarification flow is required because the LLM may guess wrong on ambiguous business terms.
- Approve / Suggest Changes buttons must be prominent after each LLM response.
- Targeted at MVP v1.

---

## US-06: Config-file-based single database connection

**Requirement status:** Active
**MoSCoW priority:** Must Have

As a Data Engineer,
I want to configure a single database connection through a configuration file or environment variables before starting the system,
so that the NLEx container connects to that database immediately upon launch without manual UI setup.

### Notes and constraints

- The corporate positioning confirmed by the customer favours static, config-based connections for MVP v1.
- Connection details live in `.env` / mounted config and are read on startup.
- Targeted at MVP v1.

---

## US-07: Startup health-check for database connection

**Requirement status:** Active
**MoSCoW priority:** Must Have

As a Data Engineer,
I want to see a health-check report at container startup showing whether the configured database connection succeeded or failed,
so that I can fix a misconfigured connection before users encounter errors.

### Notes and constraints

- Health check runs once on startup and is also exposed via a `/health`-style API endpoint.
- The Figma prototype includes an explicit "Test Connection" button matching this story.
- Targeted at MVP v1.

---

## US-08: View generated SQL

**Requirement status:** Active
**MoSCoW priority:** Must Have

As a Data Team Analyst,
I want to view the SQL that the system generated for a query,
so that I can validate its correctness and build trust in the system before recommending it to business users.

### Notes and constraints

- SQL is shown in a collapsible element, hidden by default for Business Analysts.
- Targeted at MVP v1.

---

## US-09: Query history

**Requirement status:** Active
**MoSCoW priority:** Should Have

As a Business Analyst,
I want to see a history of my previous queries with their status and results,
so that I can re-run a past query or re-download an Excel file without re-typing the request.

### Notes and constraints

- Not in the initial proposed MVP v1 scope; history is valuable but not blocking for the first usable release.

---

## US-10: Excel auto-formatting

**Requirement status:** Active
**MoSCoW priority:** Must Have

As a Business Analyst,
I want to receive the Excel file with reasonable default formatting (number separators, date formats, auto-width columns, frozen headers),
so that the file is ready to use immediately without manual cleanup.

### Notes and constraints

- Closely tied to US-03; tracked separately because formatting work is non-trivial.
- Targeted at MVP v1.

---

## US-11: Bilingual (RU/EN) natural language queries

**Requirement status:** Active
**MoSCoW priority:** Should Have

As a Business Analyst,
I want to write my query in Russian or English and have the system understand both,
so that I can use my preferred language.

### Notes and constraints

- The LLM provider supports both languages out of the box; effort is primarily in prompt tuning and UI copy.
- Targeted at MVP v1 if scope allows; otherwise deferred to a later iteration.

---

## US-12: Cross-database natural language query

**Requirement status:** Active
**MoSCoW priority:** Must Have

As a Business Analyst,
I want to submit a single natural language question that requires data from multiple databases simultaneously,
so that I can get a unified answer without manually merging results from separate queries.

### Notes and constraints

- Targeted at MVP v2; depends on the Trino-based distributed query layer.
- "Must Have" relates to the intended end-of-course product scope, not to the initial proposed MVP v1.

---

## US-13: Multiple database connections via config

**Requirement status:** Active
**MoSCoW priority:** Must Have

As a Data Engineer,
I want to configure multiple database connections in the configuration file,
so that the system can query across all of them when a user request spans databases.

### Notes and constraints

- Extension of US-06 for the cross-database scenario.
- Targeted at MVP v2.

---

## US-14: Save validated query as reusable template

**Requirement status:** Active
**MoSCoW priority:** Should Have

As a Data Team Analyst,
I want to save a validated query as a reusable template with parameters (e.g., period, region),
so that business users can run it themselves without asking me every time.

### Notes and constraints

- Targeted at MVP v2; templates are an efficiency feature, not a blocker.

---

## US-15: Run a saved template with parameters

**Requirement status:** Active
**MoSCoW priority:** Should Have

As a Business Analyst,
I want to run a saved template by filling in the required parameters,
so that I can get regular reports without typing the full question each time.

### Notes and constraints

- Pairs with US-14. Targeted at MVP v2.

---

## US-16: Share templates with specific users

**Requirement status:** Active
**MoSCoW priority:** Could Have

As a Data Team Analyst,
I want to share a template I created with specific business users,
so that they can run validated queries without my further involvement.

### Notes and constraints

- Requires user accounts and an access-control layer; deferred to MVP v2 or later.

---

## US-17: Basic usage statistics for administrators

**Requirement status:** Active
**MoSCoW priority:** Could Have

As a System Administrator,
I want to see basic usage statistics (number of queries per day, success rate, average execution time),
so that I can monitor system health and justify the cost of the LLM API.

### Notes and constraints

- The customer suggested elevating this to Must Have during the Week 2 meeting. The team has acknowledged the argument but kept it as Could Have for now; the priority will be reviewed in Sprint 2.

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

The MVP version is an internal planning dimension separate from MoSCoW priority. It tracks when a story is expected to be delivered, not how important it is.

| Version | Stories |
|---------|---------|
| **MVP v1** | US-01, US-02, US-03, US-04, US-05, US-06, US-07, US-08, US-10 (9 stories) |
| **MVP v2** | US-12, US-13, US-14, US-15, US-16 (5 stories) |
| **Shared / cross-cutting** | US-09, US-11, US-17 (3 stories) |

---

## Initial proposed MVP v1 scope

The following Must Have stories form the initial proposed MVP v1 scope: a minimal end-to-end flow demonstrating the core value proposition — natural language query against a single database, clarification if needed, in-browser preview, and Excel download. This is an initial proposal that will be refined and finalised in Assignment 3.

- US-01
- US-02
- US-03
- US-04
- US-05
- US-06
- US-07
- US-08
- US-10
