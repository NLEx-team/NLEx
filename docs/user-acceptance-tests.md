# User Acceptance Tests

User Acceptance Testing ensures the system meets the core requirements from the end-user's perspective. 

## Table of Contents
- [UAT-01: Natural Language Query to Data](#uat-01-natural-language-query-to-data)
- [UAT-02: Clarification Dialogue](#uat-02-clarification-dialogue)
- [UAT-03: Request History Navigation](#uat-03-request-history-navigation)
- [UAT-04: Cross-Database Query Execution](#uat-04-cross-database-query-execution)
- [UAT-05: Admin Panel Access & Configuration](#uat-05-admin-panel-access--configuration)

## Active UAT Scenarios

### UAT-01: Natural Language Query to Data
* **Status**: Passed
* **Related PBI**: PBI-001, PBI-002 (MVP v1 Core Flow)
* **Pre-conditions**: User is logged in and has an active database connection.
* **Steps**:
  1. Type a clear natural language question (e.g., "Show me the top 5 customers by revenue").
  2. Click send.
* **Expected Result**: System processes the request and displays a data table preview matching the SQL results.
* **Execution History**: Passed during MVP v1.0 and MVP v2.0 customer reviews.

### UAT-02: Clarification Dialogue
* **Status**: Passed
* **Related PBI**: PBI-006 (Handle Ambiguity)
* **Pre-conditions**: User is logged in and has an active database connection.
* **Steps**:
  1. Type an ambiguous question that maps to multiple potential tables or columns.
  2. Click send.
* **Expected Result**: System does not execute SQL immediately, but returns multiple-choice clarification options to resolve the ambiguity.
* **Execution History**: Passed during MVP v1.0 and MVP v2.0 customer reviews.

### UAT-03: Request History Navigation
* **Status**: Passed
* **Related PBI**: PBI-013 (Chat History)
* **Pre-conditions**: User has executed multiple queries in the past.
* **Steps**:
  1. Open the left sidebar history panel.
  2. Click on a past query session.
* **Expected Result**: The main window populates with the historical context and allows the user to continue the conversation.
* **Execution History**: Passed during MVP v2.0 customer review.

### UAT-04: Cross-Database Query Execution
* **Status**: Passed
* **Related PBI**: PBI-016 (Multiple Database Connections)
* **Pre-conditions**: System has multiple databases configured via Trino.
* **Steps**:
  1. Select Database A from the UI and execute a query.
  2. Select Database B from the UI and execute a relevant query.
* **Expected Result**: The queries are successfully routed to the respective databases and return distinct, accurate results.
* **Execution History**: Passed during MVP v2.0 customer review.

### UAT-05: Admin Panel Access & Configuration
* **Status**: Passed
* **Related PBI**: PBI-025 (Admin Dashboard)
* **Pre-conditions**: User is logged in with Admin privileges.
* **Steps**:
  1. Navigate to the Admin Panel.
  2. Add a new database connection configuration.
* **Expected Result**: The new database connection is saved and is subsequently available in the main UI for querying.
* **Execution History**: Passed during MVP v2.0 customer review.
