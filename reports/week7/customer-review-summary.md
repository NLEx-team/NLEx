# Week 7 – Customer Review Summary

## Meeting Details
- **Date:** July 17, 2026
- **Participants:**
    - Nikita Maksimenko (Customer)
    - Serafim Soldatov (Scrum Master)
    - Maxim Merkushev (Product Owner / Core Developer)

---

## Agenda & MVP v3.0 Demonstration
The team demonstrated the final iteration of the product (**MVP 3.0 / Release v3.0.0**), highlighting key improvements and addressed feedback:
1. **ChatGPT-Style Interface:** Redesigned UI to be clean, concise, and focused on usability. 
2. **Database Management:** Admins can now add, delete, and ping database connections directly from the admin dashboard.
3. **User & Role Management:** Admins can manage users, roles, and statuses. A critical safety control was implemented preventing administrators from changing the status of the primary admin to avoid self-demotion or lockout.
4. **Excel Export Optimization:** Swapped out slow XLS-writing libraries for a high-performance custom CSV-to-Excel workflow. Exporting 120,000 records now takes **~13 seconds** (down from 2-3 minutes). A progress status with export duration has been added to the UI.
5. **Persistence of Download Links:** Fixed an issue where restarting Docker containers would change file IDs and invalidate existing download links; download links now remain valid across restarts.

---

## Customer Feedback & Acceptance

### 1. Deployment Validation & Handover Status
- **Independent Testing:** Nikita confirmed that he successfully deployed the stable version of NLEx locally on a development database, configured his own CA certificates, and tested it with real data.
- **Handover Level Reached:** Both parties agreed to mark the handover status as **`Independently used by customer`**.
- **Customer-Confirmation Status:** Nikita formally **accepted** the product handover, noting that it is a "solid solution" and works well.

### 2. UI/UX Recommendations
- Nikita advised that instead of reinventing the UI layouts, the team should leverage existing enterprise patterns for data-heavy views (e.g., placing filters at the top and history tables below) to keep it intuitive.

### 3. Focus on Finalization
- Nikita recommended halting new feature additions to avoid introducing new bugs. The priority for the remaining days should be manual testing, polishing the web-deployed version, and fixing minor issues.

### 4. Code & Repository Guidelines
- **Open Source:** Confirmed that the repository will remain public/Open Source.
- **Portfolio Enhancements:** Nikita recommended polishing the repository main page (`README.md`) and expanding the `CONTRIBUTING.md` page with a dedicated team section describing everyone's exact roles and contributions. This will serve as a strong portfolio showcase for future applications.

### 5. Demo & In-Person Defense
- Nikita is returning to Innopolis next Saturday and requested an invitation to the final defense next week. He expressed interest in attending.

---

## Action Items & Next Steps
- [ ] Fix the web-version bug where Excel files download as HTML (works locally, but needs to be resolved in the production environment).
- [ ] Finalize manual testing of critical paths.
- [ ] Update documentation (`docs/customer-handover.md`, `README.md`, and `docs/contributing.md`) with the accepted handover status and the team roles portfolio showcase.
