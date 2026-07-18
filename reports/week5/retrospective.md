# Sprint Retrospective

## Date
2026-07-05

## What Went Well
- **Delivering MVP v2:** The team successfully delivered the targeted MVP v2 features, including the Oracle connector and Excel export, satisfying the customer's priority feedback.
- **Architecture Documentation:** Formalizing our architecture with C4 models (static, dynamic, and deployment views) helped us clarify the system boundaries and understand how our decisions support our quality requirements.
- **CI Pipeline:** The CI pipeline remained stable and caught a few integration issues early before they reached the main branch.

## What Didn't Go Well
- **Scope Underestimation:** Configuring the Trino Oracle connector was more complex than initially estimated due to driver dependencies, leading to some rushed work at the end of the Sprint.
- **ADR Backtracking:** We struggled initially to document ADRs for decisions made in previous sprints because we had to recall the exact context and alternatives considered at that time.

## What We Learned
- We learned the value of "Diagrams-as-Code" (PlantUML/Mermaid). Storing diagrams in the repo makes them much easier to update and review alongside code changes.
- Writing ADRs concurrently with making the decision is much easier than trying to reconstruct the decision process weeks later.

## Concrete Process Change for Next Sprint
- **Action Item:** From now on, whenever a significant architectural or technical decision is made that impacts our quality requirements, we will write and review the ADR as part of the Definition of Done for that specific PBI, rather than waiting until the end of the Sprint.
- **Action Item:** For complex integrations (like new database connectors), we will allocate a "spike" PBI in the preceding Sprint to investigate dependencies and reduce estimation uncertainty.
