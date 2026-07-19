# LLM Usage Report — Week 7

## 1. Tool Usage

The following LLM tools were used during Week 7:

* **Gemini CLI / ChatGPT:** Utilized strictly as a syntax-checking, structure formatting, and spelling assistant for reports and customer documentation.
* **GPT-4o / GPT-4o-mini (via OpenAI API):** Used strictly as the runtime inference engine for the core product query translation features.
* **GitHub Copilot:** Used strictly as a basic autocomplete tool for routine boilerplate code.

## 2. Tasks Performed

* **Documentation Formatting & Proofreading**: The tool was used to structure and review formatting syntax for the updated [docs/customer-handover.md](../../docs/customer-handover.md) and [docs/deployment/per-service.md](../../docs/deployment/per-service.md).
* **Report Structuring**: Used the LLM to format the week 7 report index, reflection, retrospective, and sprint review notes based on our raw meeting summaries.
* **Boilerplate Autocomplete**: GitHub Copilot was used to autocomplete standard boilerplate syntax during the migration from `openpyxl` to `xlsxwriter` for the Excel export improvement task.

## 3. Analysis and Original Effort

During Week 7, LLMs served strictly as lightweight utilities for textual formatting and standard code autocomplete. All core architecture changes and design decisions were made solely by the engineering team.

Specifically:
- The design and implementation of the Excel export migration to `xlsxwriter` (PBI-033) to resolve memory leak issues was conceived and executed manually.
- The analysis and decision to deprecate the Kubernetes deployment guides (PBI-035) due to shifting scope was entirely human-driven.
- The identification and resolution of the 4 critical customer deployment blockers (Nginx SPA routing, dynamic CORS, backend health checks, and config separation) were investigated and resolved entirely by human team members.
- The compilation of all final handover materials and the structure of our rehearsal segments for Demo Day were organized by the team without any external automated systems.
