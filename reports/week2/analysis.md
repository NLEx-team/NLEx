# Weekly Analysis: NLEx Team


### Learning Points

**User Stories & Prioritization**
- The team learned to apply the **MoSCoW prioritization technique** to distribute features across MVP 1.0 and MVP 2.0. The key insight was acknowledging that **not everything can be implemented in a single release** — resources are inherently limited, and saying "no" or "later" to features is essential for delivering a focused product. However, the team also recognized they have sufficient time (8 weeks) to realize the project's potential without falling into the trap of gold-plating.
- Writing user stories from multiple personas (Business Analyst, Data Analyst, Data Engineer, System Administrator) helped surface feature conflicts early — for example, the tension between a simple chat interface for business users and the need for SQL previews for technical users. This led to design decisions about role-appropriate visibility.

**Prototyping & Interface Design**
- Building the Figma prototype before writing code forced the team to think through user flows concretely. The exercise revealed gaps between user stories and visual representation — **US-2 was not reflected in the initial design**, highlighting the need for tighter synchronization between documentation and design artifacts.
- The team gained practical experience in preparing and presenting design work to a client, learning to navigate real-time feedback and translate verbal suggestions (e.g., Perplexity reference for action buttons) into actionable design revisions.

**MVP v0 Technical Work**
- The team had to adapt to **new, unexplored technologies** — specifically the Trino library for cross-database queries. This required research and hands-on experimentation, particularly around the performance trade-offs between static and dynamic catalog connections.
- A key collaboration moment occurred when Maksim Maltsev initially planned to deploy the service locally, but **Maksim Merkushev proposed using Vercel** (Berd wheel) for free hosting — an idea Maltsev embraced. This demonstrated the value of cross-role problem-solving within the team.
- The team improved their ability to **decompose large tasks into smaller, manageable units**, a skill critical for progressing from a broad vision to an implementable MVP v0 foundation.

**Customer Validation of Interface**
- The customer (Nikita) was walked through the full Figma prototype and provided detailed, actionable feedback on the UI. His responses confirmed that the proposed interface direction aligns with real user needs, while also surfacing specific gaps (missing "Test Connection" button, need for DB alias naming, UX concerns around Reply Preview complexity).

---

### Validated Assumptions

| Assumption | Status | Evidence |
|---|---|---|
| Users need to distinguish multiple databases by name, not just URL | **Confirmed** | Customer explicitly requested a "Title" / alias field on the Add Database screen |
| Users expect a "Test Connection" button when adding databases | **Confirmed** | Customer raised this unprompted, referencing other services; team agreed it is a Must Have |
| The LLM can auto-detect the correct database from context | **Confirmed** (in principle) | Maksim Merkushev shared testing experience: the LLM handles cross-database routing well and will ask clarifying questions when ambiguous. Customer accepted this approach |
| A Perplexity-style action bar (share, download, copy, regenerate) is preferable to show/hide input fields | **Partially confirmed** | Customer provided a concrete reference and the team agreed; the designer will adapt the UX. Exact implementation details remain to be validated in MVP v0 |
| The primary user persona is a Business Analyst who cannot write SQL | **Confirmed** | Customer validated the persona definition and role-based feature separation |
| The product is positioned as a corporate tool, not for personal use | **Confirmed** | Customer explicitly stated this; the architectural discussion (static vs. dynamic DB) was reframed around this positioning |
| SQL preview is valuable primarily for data analysts, not business analysts | **Confirmed** | Customer agreed it should not interfere with the primary user's experience; collapsible element proposed |
| Trino library would support cross-database querying | **Confirmed** (with caveat) | Technical investigation confirmed Trino works for dynamic connections, but dynamic mode operates in beta and is slower than static configuration |
| Usage statistics (US-17) are important enough to consider raising to Must Have | **Partially confirmed** | Customer strongly advocated for this; the team acknowledged the argument but the final priority is still under consideration |

---

### Needs Clarification

| Item | Description | Risk Level |
|---|---|---|
| **Static vs. Dynamic DB Connection for MVP 1.0** | The team has not yet decided which approach to implement. Static (config-file based, requires restart) is simpler and faster with Trino. Dynamic (UI-driven, per-user) is more flexible but requires user isolation and has beta-level performance. This decision impacts architecture, deployment, and user experience. | **High** — blocks MVP 1.0 implementation |
| **Scope boundary for MVP 1.0 vs. 2.0** | The customer suggested 10–11 user stories for MVP 1.0, but the exact boundary (US-11 inclusion) was left slightly ambiguous. The team must formally finalize the list. | **Medium** |
| **Priority of US-17 (Usage Statistics)** | Customer proposed elevating this to Must Have. The team has not committed yet. If included, it affects MVP 1.0 scope and timeline. | **Medium** |
| **Exact UX for Reply Preview** | While the Perplexity reference was accepted as a direction, no specific mockup was agreed upon. The final design needs customer re-validation. | **Low** |
| **US-2 and design synchronization** | US-2 exists in the backlog but is missing from Figma. The content of US-2 and whether it belongs in MVP 1.0 or 2.0 needs clarification. | **Low** |
| **Admin panel feasibility (MVP 2.0)** | The customer proposed an admin panel with role separation and LLM model selection. The team acknowledged this as interesting but deferred detailed scoping. The technical complexity and effort estimate remain unknown. | **Low** (deferred to later sprints) |

---

### Planned Response

| Learning / Clarification | Impact on MVP v1 | Affected Artifacts |
|---|---|---|
| Tighten design-documentation synchronization | The team will review all MVP 1.0 user stories against the Figma prototype and fill any gaps (especially US-2) before Sprint 2 planning. | US-2, Figma prototype, Product Backlog |
| Incorporate customer design feedback | Three concrete UI changes will be made: (1) Add "Title" alias field to Add Database form, (2) Add "Test Connection" button, (3) Redesign Reply Preview to use compact action buttons (Perplexity-style) and move SQL preview into a collapsible element. | US-1, US-4, US-7, Figma screens |
| Resolve static vs. dynamic DB connection decision | The team will make a final decision early in Sprint 2, weighing the customer's preference for simplicity ("do what's easier and more convenient") against the long-term architectural vision. The corporate-only positioning favors the static approach for MVP 1.0. | US-3, Architecture Decision Record |
| Finalize MVP 1.0 scope | Confirm the exact list of user stories (10 or 11) for MVP 1.0 and lock it for Sprint 2 execution. Decide on US-17 priority. | Product Backlog, Sprint Backlog |
| Prepare for MVP v0 demo | Deploy the MVP v0 environment (Vercel with pre-loaded API keys) and prepare a verified local-deployment instruction with OpenAI-compatible API support (env variables for token, URL, model ID). | Deployment documentation, README |
| Defer MVP 2.0 items | Admin panel, query templates, and orchestrator-based dynamic DB management are parked for MVP 2.0 discussion. No implementation work will begin on these until MVP 1.0 is delivered and validated. | US-12 through US-17, Architectural notes |
