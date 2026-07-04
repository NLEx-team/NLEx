# LLM Usage Report — Week 4

## 1. Tool Usage

The following LLM tools were used during Week 4 documentation setup:

* **Gemini CLI:** Utilized as a basic text-formatting assistant to help structure the report outline and parse raw customer review notes.
* **GPT-4o-mini (via OpenAI API):** Used strictly as a runtime engine for the core product functionality (translating natural language queries into SQL).

## 2. Tasks Performed

* **Artifact Processing:** Used the LLM to quickly extract keywords and format raw notes from the customer review transcript (`reports/week4/customer-review-transcript.md`). 
* **Drafting the Backlog:** Generated initial raw descriptions for 15 PBIs based on human-provided feedback points. The core estimates, priorities, and technical implementation details were heavily adjusted and corrected manually to reflect actual project reality.
* **Criteria Generation:** Created basic, structural acceptance criteria templates for the new backlog items, which were later manually refined to meet quality standards.
* **Report Indexing:** Used the tool to boilerplate the structural layout of the Week 4 report files (`README.md`, retrospective, reflection, customer review summary).

## 3. Analysis and Original Effort

The LLM acted strictly as a drafting aid for routine documentation. The actual engineering and analytical work was entirely manual: the generated feedback points and PBIs were thoroughly audited, rewritten, and mapped precisely to technical dependencies (such as the Oracle connector and UI bug fixes) by cross-checking the current codebase. 

Furthermore, critical decisions such as Sprint Planning, technical architecture (e.g., chat persistence migration strategy, credential encryption), and quality requirement definitions (ISO/IEC 25010) were decided entirely by the human team members, overriding any generic LLM suggestions. The Sprint Review meeting, UAT session, and all customer communication were conducted entirely by the team. No LLM-generated content was submitted without human review and verification against the actual project state.
