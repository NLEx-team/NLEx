
# Week 7 – Sprint 5 Final Report

## Reference to Week 6
- **Week 6 Report**: [Week 6 README.md](../week6/README.md)

---

## Sprint Backlog & Planning

- **Product Backlog Board**: [GitHub Projects Board](https://github.com/orgs/NLEx-team/projects/1)
- **Sprint 5 Backlog Board**: [Sprint 5 Board](https://github.com/orgs/NLEx-team/projects/1/views/2)
- **Sprint 5 Milestone**: [Sprint 5 Milestone](https://github.com/NLEx-team/NLEx/milestone/5)
- **Sprint 5 Goal**: Deliver final follow-up maintenance, resolve customer deployment blockers, complete per-service configuration documentation, implement chart generation/Excel export improvements, and transition the final MVP v3 to the customer.
- **Sprint Dates**: July 13, 2026 – July 19, 2026
- **Total Story Points**: 24

---

## Sprint Scope Summary

Sprint 5 focused heavily on completing the transition documentation and unblocking the customer's ability to independently deploy the system. 
**Key Deliverables (`MVP v3` changes):**
- **Excel Export Performance**: Swapped `openpyxl` with `xlsxwriter` leading to massive memory usage reductions and faster speeds. Added download animations.
- **Customer Deployment Blockers Resolved**: Fixed issues with Nginx SPA routing (404 on refresh), configured dynamic CORS origins, and solved backend health-check inconsistencies.

---

## Product Access

- **Deployed Final Product**: [https://nlex.tech/](https://nlex.tech/)
- **Access/Run Instructions**: See [README.md](../../README.md) and [Hosted Documentation](https://nlex-team.github.io/NLEx/)

---

## Documentation Links

| Document | Link |
|----------|------|
| README.md | [README.md](../../README.md) |
| CONTRIBUTING.md | [CONTRIBUTING.md](../../CONTRIBUTING.md) |
| AGENTS.md | [AGENTS.md](../../AGENTS.md) |
| Customer Handover | [docs/customer-handover.md](../../docs/customer-handover.md) |
| Hosted Documentation | [GitHub Pages](https://nlex-team.github.io/NLEx/) |
| CHANGELOG.md | [CHANGELOG.md](../../CHANGELOG.md) |

---

## Final Transition Outcome

- **Handover Level Reached**: `Independently used by customer`
- **Customer-Confirmation Status**: `Accepted`

### Transition Scope
As documented in [docs/customer-handover.md](../../docs/customer-handover.md), we have transitioned:
- Full repository access on the stable branch (`v3.0.0`) under the MIT License.
- Detailed deployment configuration guidelines for self-hosting with Docker Compose.
- We intentionally retain management of the `nlex.tech` domain and current demo deployments until the customer is fully ready to switch DNS.

### Transition Blockers & Limitations
All primary transition blockers have been resolved. The customer successfully verified local deployment by embedding his own custom CA/VPN certificates.

### Independent Use Evidence
During the Week 7 review, the customer confirmed that he successfully deployed the system locally against a development database, embedded necessary certificates, and verified its functionality.

---

## Customer Feedback Response Table

| # | Feedback Point / Requirement | Source | Action | PBI/Issue | Status |
|---|------------------------------|--------|--------|-----------|--------|
| 1 | Chart generation / Excel Export | Week 6 meeting | Implemented performance fixes and UI in Sprint 5 | PBI-033 | ✅ Done |
| 2 | Per-service deployment docs for Kubernetes | Week 6 meeting | Kubernetes deployment is deprecated. | PBI-035 | ❌ Deprecated |
| 3 | MCP integration for DB-specific optimization | Week 6 meeting | Deprecated due to architectural complexity. | PBI-039 | ❌ Deprecated |
| 4 | Chat folder organization | Week 5 meeting | Deprecated and removed from codebase based on product direction. | PBI-031 | ❌ Deprecated |
| 5 | Sorting/filtering in user table | Week 5 meeting | Implemented sorting and filtering in the user table. | PBI-030 | ✅ Done |

---

## UAT and Customer Trial Results

The customer successfully deployed the stable version of NLEx locally on a development database with real data and verified its functionality. The UAT scenarios for MVP v3 passed, with specific verification of:
1. **Performance at Scale:** Switched to a faster Excel-export library, reducing export time for 120,000 records to ~13 seconds.
2. **Container Persistence:** Verified that download links remain valid and files are preserved across Docker container restarts.

---

## Release & Demo Video

- **Final Release (MVP v3)**: [v3.0.0](https://github.com/NLEx-team/NLEx/releases/tag/v3.0.0) 
- **Public Sanitized Demo Video**: [Demo Video (Google Drive)](https://drive.google.com/file/d/1-30xjnNSBdMfxz_5ALgvwesLMLa36H3Z/view?usp=sharing)

---

## Demo Day Preparation

The team has prepared the final presentation slide deck and completed the required Week 7 rehearsal preparation. Each team member has been assigned their speaking segments and the demo video has been pre-recorded to fit within the 2-minute limit.

---

## Sprint Review & Customer Review

- **Sprint Review Notes**: [sprint-review-notes.md](sprint-review-notes.md)
- **Customer Review Transcript**: [customer-review-transcript.md](customer-review-transcript.md)
- **Customer Review Summary**: [customer-review-summary.md](customer-review-summary.md)

---

## Reflection, Retrospective & LLM Report

- **Sprint Review Summary**: [sprint-review-summary.md](sprint-review-summary.md)
- **Reflection**: [reflection.md](reflection.md)
- **Retrospective**: [retrospective.md](retrospective.md)
- **LLM Usage Report**: [llm-report.md](llm-report.md)

---

## Final Product Status

**MVP v3 (Release v3.0.0)** is final and fully functional. It incorporates all planned performance fixes, enterprise-grade deployment documentation, and resolved configuration blockers. The product stands ready for full handover and operation by the customer.

---

## Contribution Traceability

| Team Member | Role | Key Contributions (Sprint 5) |
|-------------|------|------------------------------|
| **Maksim Merkushev** | Product Owner | Implemented Excel export perf fixes, Resolved 4 deployment blockers, authored Arch docs. |
| **Serafim Soldatov** | Scrum Master | Week 7 reporting, Sprint milestone management, Retrospective moderation, Demo Day preparation. |
| **Maksim Maltsev** | Developer | Assisted with Architecture diagram updates, UI bug fixes. |
| **Polina Systerova** | Developer | Quality docs & UAT review for MVP v3, Demo Day presentation rehearsal. |
| **Ramina Ianturina** | Developer | Reviewed rich download animation UI/UX, presentation preparation. |
| **Liubov Savchenko** | Developer | Co-authored per-service deployment docs, API stability testing. |

---

## Screenshots

### Backlog & Kanban Boards
* **Sprint 5 Milestone**:
  ![Sprint 5 Milestone](images/Sprint_milestone.png)

### Final Release
* **MVP v3 Release (v3.0.0)**:
  ![Release v3.0.0](images/Release.png)

### Traceability: Issue-Linked PRs
* **PR Example 1**:
  ![PR Example 1](images/PR_example(1).png)
* **PR Example 2**:
  ![PR Example 2](images/PR_example(2).png)
* **PR Example 3**:
  ![PR Example 3](images/PR_example(3).png)
