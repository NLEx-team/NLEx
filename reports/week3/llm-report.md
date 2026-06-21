## # LLM Usage Report — Week 3

## 1. Tool Usage

The following LLM tools were used during Week 3 documentation setup:

* **Gemini CLI:** Utilized as a basic text-formatting assistant to help structure the report outline and parse existing Week 2 text files.
* **GPT-4 (via Gemini CLI):** Used primarily to accelerate the routine drafting of standard Product Backlog Item (PBI) descriptions and boilerplate acceptance criteria based on human-provided inputs.

## 2. Tasks Performed

* **Artifact Processing:** Used the LLM to quickly extract keywords from `reports/week2/user-stories.md` and `reports/week2/mvp-v0-report.md`.
* **Drafting the Backlog:** Generated initial raw descriptions for 15 PBIs. The core estimates (Story Points) and MoSCoW priorities were heavily adjusted and corrected manually to reflect actual project reality.
* **Criteria Generation:** Created basic, structural acceptance criteria templates for the backlog items, which were later refined to meet Assignment 3 quality standards.
* **Report Indexing:** Used the tool to boilerplate the structural layout of the `reports/week3/README.md` index file.

## 3. Analysis and Original Effort

The LLM acted strictly as a drafting aid for routine documentation. The actual engineering and analytical work was entirely manual: the generated items were thoroughly audited and rewritten to map precisely to technical dependencies (such as the Trino engine architecture and specific FastAPI endpoints) by cross-checking the codebase (`backend/src/`). Furthermore, the critical logic behind the Sprint Backlog (Sprint 1) prioritization was decided entirely by the human author to align with the strategic MVP v1 scope from Week 2, overriding generic LLM suggestions.ition of PBIs, the mapping to specific technical dependencies (like the Trino engine and specific FastAPI endpoints) was verified against the existing codebase (`backend/src/`). The prioritization of the Sprint Backlog (Sprint 1) was aligned with the "initial proposed MVP v1 scope" documented in the Week 2 reports.
