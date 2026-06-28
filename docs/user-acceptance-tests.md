# User Acceptance Tests

User Acceptance Testing ensures the system meets the core requirements from the end-user's perspective. 

## Active UAT Scenarios

### UAT-01: Natural Language Query to Data
* **Status**: Passed (Week 4)
* **Pre-conditions**: User is logged in and has an active database connection.
* **Steps**:
  1. Select database from sidebar.
  2. Type a clear natural language question (e.g., "Show me the top 5 customers by revenue").
  3. Click send.
* **Expected Result**: System processes the request and displays a data table preview matching the SQL results.
* **Execution History**: Passed during MVP v1.0 customer review. Customer successfully queried tables.

### UAT-02: Clarification Dialogue
* **Status**: Passed (Week 4)
* **Pre-conditions**: User is logged in and has an active database connection.
* **Steps**:
  1. Type an ambiguous question that maps to multiple potential tables or columns.
  2. Click send.
* **Expected Result**: System does not execute SQL immediately, but returns multiple-choice clarification options to resolve the ambiguity.
* **Execution History**: Passed during MVP v1.0 customer review.

### UAT-03: Excel Data Export
* **Status**: Passed (Week 4)
* **Pre-conditions**: User has successfully executed a query and is viewing the result table.
* **Steps**:
  1. Click the "Export" button on the data table preview.
* **Expected Result**: An `.xlsx` file is downloaded, containing the complete dataset from the executed query.
* **Execution History**: Passed during MVP v1.0 customer review. Customer downloaded file and opened it successfully.
