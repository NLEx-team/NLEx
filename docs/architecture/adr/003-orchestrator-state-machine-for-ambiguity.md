# ADR-003: Orchestrator State Machine for Ambiguity

## Status
Accepted

## Context
Users often submit ambiguous natural language queries that could map to multiple tables or columns. Executing an incorrect assumption can lead to wrong business decisions.

## Decision
We decided to implement an **Orchestrator State Machine** that explicitly handles ambiguity. Before executing SQL, the orchestrator evaluates the prompt via the LLM. If ambiguity is detected, the state machine transitions to `CLARIFICATION_REQUIRED` and returns options to the frontend instead of proceeding to `EXECUTION`.

## Consequences
* **Positive**: Directly addresses **QR-003 (Usability - User Error Protection)**. It protects users from incorrect assumptions by forcing clarification, improving the overall reliability of the insights generated.
* **Negative**: Increases the latency of the initial request and adds complexity to the frontend, which now must handle intermediate states and prompt chaining.
