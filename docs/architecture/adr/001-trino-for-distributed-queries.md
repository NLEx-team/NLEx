# ADR-001: Trino for Distributed Queries

## Status
Accepted

## Context
NLEx needs to query multiple disparate enterprise databases (PostgreSQL, Oracle, etc.) based on natural language inputs. We needed a way to execute these SQL queries reliably across different dialects and database engines without writing complex ETL pipelines or maintaining custom connection pooling for each database type.

## Decision
We decided to use **Trino** as the federated distributed SQL query engine. The backend will exclusively send generated SQL queries to Trino, and Trino will manage the connections and execution against the target databases via its connector architecture.

## Consequences
* **Positive**: Greatly simplifies the backend architecture. Adding a new database source only requires configuring a Trino connector. It natively supports querying multiple databases efficiently, satisfying **QR-001 (Performance Efficiency)**.
* **Negative**: Introduces a new heavy infrastructure component (Trino) into the deployment stack, increasing the minimum memory requirements for running the application.
