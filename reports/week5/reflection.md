# Reflection

## What We Learned
During Week 5, our primary focus was on finalizing MVP v2 while formalizing our architecture and development processes. 

**Documenting Architecture & Recording ADRs:**
We learned that clearly separating our architecture into static, dynamic, and deployment views (using the C4 model concepts) made reasoning about the system much easier. It highlighted exactly how our early decisions—like using Trino to federate data and an Orchestrator State Machine to handle user ambiguity—directly supported our non-functional quality requirements (Performance and Usability). Recording Architecture Decision Records (ADRs) forced us to articulate the "why" behind our technical choices, which will be invaluable for onboarding new team members and maintaining the system long-term.

**Refining Workflow & Managing Configuration:**
We formalized our git workflow using a Mermaid `gitGraph` in our development process documentation. This visual representation clarified our branching strategy (feature branches to `main`) and our release tagging. We also solidified our configuration management, ensuring that environment variables and secrets are handled securely in our Docker Compose deployment and not leaked into the repository. 

**Delivering MVP v2 & Reviewing with the Customer:**
Delivering MVP v2 and reviewing it with the customer reinforced the value of incremental delivery. By providing concrete features requested in the last sprint (Oracle connector, Excel export), we built trust with the stakeholders. The UAT session during the Sprint Review proved that our features worked in a real-world scenario. The feedback we received (need for RBAC and query timeouts) directly feeds into our next sprint, proving that our agile feedback loop is functioning correctly.
