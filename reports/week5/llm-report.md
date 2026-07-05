# LLM Usage Report — Week 5

## 1. Tool Usage

The following LLM tools were used during Week 5:

* **Gemini CLI / ChatGPT:** Utilized strictly as an enhanced text-formatting assistant and boilerplate generator to help structure our documentation, Markdown files, and format text.
* **GPT-4o-mini (via OpenAI API):** Used strictly as the runtime engine for the core product functionality (translating natural language queries into SQL and detecting ambiguity).

## 2. Tasks Performed

* **Diagram Formatting:** We conceptually designed the C4 architecture (Static, Dynamic, and Deployment views). The LLM was used merely as a syntax assistant to convert our human-defined components and relationships into syntactically correct PlantUML and Mermaid markup. 
* **ADR Boilerplating:** We used the LLM to generate the empty structural templates for our Architecture Decision Records (ADRs). The actual context, rationale, and consequences for Trino and the Orchestrator State Machine were written entirely by the team.
* **Report Structuring:** Used the tool to help format the structural layout of the Week 5 report files (`sprint-review-summary.md`, `reflection.md`, `retrospective.md`), taking our raw, bulleted notes and turning them into properly formatted Markdown tables and sections.

## 3. Analysis and Original Effort

The LLM acted strictly as a formatting and drafting aid for routine documentation tasks. The actual engineering, architectural reasoning, and analytical work were entirely manual. The decision to use Trino for federated queries, the implementation of the JWT middleware, and the design of the Orchestrator State Machine were all derived from human analysis of the ISO/IEC 25010 quality requirements (Performance, Security, and Usability). 

Furthermore, critical tasks such as configuring the Oracle connector, adjusting the Trino catalog settings, and updating the User Acceptance Tests to reflect MVP v2.0 cross-database capabilities were executed and tested manually by the engineering team. The Sprint Review meeting, customer communication, and extraction of new PBIs (Filters, NoSQL support) were conducted entirely by the human team members. No LLM-generated content was submitted without human review and verification against the actual project state.
