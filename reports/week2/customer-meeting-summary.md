**Meeting Summary: NLEx Team — Second Client Sync**

**Date:** Saturday, Week 2 of Summer Semester
**Attendees:** Nikita Maksimenko, Serafim Soldatov, Maksim Maltcev, Lyubov Savchenko, Maksim Merkushev, Polina Systerova

---

**1. Administrative Matters & Scheduling**

- Two team members were absent with valid reasons (Saturday commitments). Meeting notes will be shared to bring them up to speed.
- **Next meeting scheduled:** Thursday (Week 3), tentatively after 1–2 p.m., approximately 4 p.m. Exact time to be confirmed later.
- Nikita confirmed consent to **record meetings** for transcript generation needed for course assignments.
- Transcripts will be stored in the team's **open repository**. The project is confirmed as **open source under MIT license**.

---

**2. Figma Design Review**

Lyubov Savchenko presented the UI mockups. Key discussion points:

- **Mode toggle & sidebar:** Dark/light mode and collapsible panels were shown. The team opted to use a white background preview for better visibility.
- **Authorization flow:** Login and signup are on a single page. A second page (originally "edit profile") was clarified as an optional registration continuation and can be removed if needed.
- **Database connection screen:** Users can add multiple databases (URL, password, type: PostgreSQL, Oracle, ClickHouse, etc.).
- **Nikita's feedback on DB screen:**
    - Add a **"Title" / alias field** so users can name databases for easy identification (e.g., "Business Logic," "Traffic").
    - Add a **"Test Connection" button** to verify database availability before saving — confirmed as a **Must Have**.
    - IP field for firewall allow-listing is **not required** for now.
- **Chat & Reply Preview:**
    - After a query, a **preview summary** with key metrics is shown before generating the full Excel file. Users can **Save & Download** or **Edit** (continue the dialogue).
    - Nikita suggested a UI improvement: instead of showing/hiding input fields, use a dedicated bottom bar with action buttons (inspired by Perplexity's UX) — Lyubov noted this as a reference.
    - **Maksim Maltsev** emphasized that clarification buttons ("Approve" / "Suggest Changes") should be prominent after each LLM response, ensuring the user confirms the AI correctly understood the request.
- **Database context in chats:**
    - Nikita argued that connecting databases at the start of every chat is cumbersome. Credentials should persist, and the LLM should auto-detect which database to query.
    - If multiple databases contain relevant data, the LLM should ask a clarifying question.
    - Agreed to separate DB management (in sidebar/settings) from the chat, with an optional **"Advanced Settings"** toggle to manually select databases per chat for power users.

---

**3. User Stories & MVP Scope**

Serafim presented the updated Agile user stories and MVP breakdown.

- **Personas defined:** Primary — Business Analyst (no SQL skills), Secondary — Data Analyst, Tertiary — Data Engineer / System Administrator.
- **MVP 1.0 scope:** First 10 (or 11) user stories were reviewed and approved.
    - US-2 noted as missing from the current Figma design — requires synchronization.
    - US-7 (Test Connection) confirmed as Must Have.
- **MVP 2.0 scope preview:**
    - Focus on cross-database queries (US-12, US-13) and templates (US-14, US-16, Should Have).
    - **Nikita's priority suggestions:**
        - **US-17 (Usage statistics/monitoring dashboard):** Proposed to be elevated to **Must Have**, as it is critical for optimization and understanding system performance across users.
        - **Admin panel for MVP 2.0:** Introduced the concept of separating roles — an admin configures databases via a web panel, while end users simply log in and use the chat without seeing the underlying DB connections. The admin could also select which LLM model to use.
- **Static vs. Dynamic DB connection debate (Technical Deep Dive):**
    - The team uses **Trina** for cross-database queries. Dynamic catalog connections work in beta but are slower and require user isolation.
    - Static connections (config files, service restart) are faster for corporate use cases where databases don't change frequently.
    - Nikita proposed an architectural solution for MVP 2.0: an **orchestrator service** that manages configuration, issues restart commands, and effectively makes static configurations dynamic without complex in-app isolation.
    - **Decision:** For MVP 1.0, implement the simpler, more performant approach (config-based static connection or UI-driven), deferring the orchestration pattern to MVP 2.0.

**Product positioning confirmed:** This is a **corporate tool** (not personal use), so functionality should optimize for fixed, known database sets rather than arbitrary user uploads.

---

**4. AI & Deployment**

- **Testing options for the client:**
    - For the MVP demo: The team will host on a free platform (**Berd wheel**), pre-load API keys, and provide a link for live testing.
    - For Nikita's local testing with real, sensitive data: The team will provide Docker instructions and support for environment variables (API key, URL, model ID) to run the LLM locally. OpenAI Compatible API standard will be supported.
- **Hosting:** The team received free VMs from Innopolis. GitLab CI/CD access (runners) may be provided by Week 6, but for now, plain Git repositories are sufficient.

---

**5. Deadlines**

- **MVP 1.0 demo:** Planned for Week 3 (Thursday meeting) or mid-Week 4 at the latest.
- **Total project duration:** 8 weeks (entire summer semester).

---

**Action Items & Decisions:**

- **Design (Lyubov):** Add DB "Title" alias field and "Test Connection" button to the Add Database screen. Refine Reply Preview UX with action buttons (Perplexity reference). Separate DB connection management from chat flow.
- **Requirements (Serafim):** Update user stories to reflect the agreed scope (US-2 synchronization with design, US-17 priority increase, Admin panel deferred to MVP 2.0).
- **Backend/Architecture (Maksim Maltsev):** Implement static/dynamic DB connection decision for MVP 1.0. Prepare local deployment instructions with environment variable support for the client.
- **Client (Nikita):** Will test the demo on the hosted version and subsequently test locally on real data.
