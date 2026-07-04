# Customer Review Summary — Week 4

## Meeting Details
* **Date:** Week 4, Sprint 1 Review
* **Format:** Video call with screen sharing (customer-driven live testing)
* **Participants:**
  * Serafim Soldatov — Scrum Master / Team Lead
  * Maxim Merkushev — Backend Lead
  * Nikita Maksimenko — Customer / Product Owner
* **Duration:** ≈ 27 minutes
* **Recording permission:** Obtained; transcript published with customer consent.

---

## Sprint Goal Reviewed
Deliver a functional end-to-end NL2SQL flow on a single database, including query preview, clarification, and Excel download with formatting (**MVP v1.0**).

---

## Delivered Increment
MVP v1.0 — a fully functional Natural Language to SQL service deployed at [https://nlex.tech](https://nlex.tech):

| Feature | Status |
|---|---|
| Chat-based natural language query interface | ✅ Delivered |
| LLM-powered SQL generation (GPT-4o-mini) | ✅ Delivered |
| Multi-turn clarification dialogue with option buttons | ✅ Delivered |
| Inline result preview table with horizontal scroll | ✅ Delivered |
| Excel export (`.xlsx`) with auto-formatting | ✅ Delivered |
| JWT-based authentication (registration + login) | ✅ Delivered |
| Admin role — database catalog management (add/delete) | ✅ Delivered |
| Chat history sidebar with auto-generated titles | ✅ Delivered |
| Context-aware schema caching for fast responses | ✅ Delivered |
| Dockerized deployment (dev/prod/test profiles) | ✅ Delivered |

---

## UAT Results
The customer (Nikita Maksimenko) performed live, unscripted testing of the deployed system:

| Scenario | Result |
|---|---|
| Register and log in | ✅ Passed |
| Submit a natural language query and receive SQL + data | ✅ Passed |
| Receive and respond to clarification options | ✅ Passed |
| View query results in the inline table | ✅ Passed |
| Export results to Excel | ✅ Passed |
| View and navigate chat history | ✅ Passed |
| Admin: add/delete database catalogs | ✅ Passed (with UI issues noted) |

---

## Quality Evidence Discussed
* Backend test suite: 14 test files covering auth, users, orchestrator, schema service, LLM service, distributed DB
* Lychee link-checking CI on GitHub Actions (runs on push to `develop`/`main` and on PRs)
* Docker `test` profile for isolated backend test execution
* Protected branches: `main` and `develop` with PR review requirements

---

## Customer Feedback

| # | Feedback Point | Transcript Ref | Resulting PBI |
|---|---|---|---|
| 1 | No explicit UI button to select database before querying | [02:34–02:56] | PBI-019 |
| 2 | Input field blocked during response generation | [08:08–08:16] | PBI-020 |
| 3 | Clicking clarification option buttons overwrites user draft text | [08:31] | PBI-021 |
| 4 | Need an "Other" hint button on clarification option sets | [13:06–13:32] | PBI-022 |
| 5 | Chat titles generated too early from short prompts | [14:00–15:02] | PBI-023 |
| 6 | Large result sets (>1 000 rows) should auto-export to downloadable file | [09:06–09:56] | PBI-024 |
| 7 | Admin "Add Database" form lacks a DBMS type selector | [15:12–15:44] | PBI-025 |
| 8 | Registration form doesn't show password requirements | [16:58–17:14] | PBI-026 |
| 9 | Delete Database button visible to regular users (should be hidden) | [17:14–17:37] | PBI-027 |
| 10 | Need a "Check Connection" button for regular users | [17:37–17:45] | PBI-028 |
| 11 | Display database server ping/latency | [17:45–18:04] | PBI-029 |
| 12 | Admin dashboard with token usage & per-user analytics | [18:42–19:53] | PBI-030 |
| 13 | LLM API configuration (key, URL, model) in admin panel, not `.env` | [20:59–21:29] | PBI-031 |
| 14 | Oracle DBMS connector for customer's production databases | [22:08–25:19] | PBI-032 |
| 15 | Comprehensive local deployment guide | [25:43–26:10] | PBI-033 |

---

## Approvals & Requested Changes
* ✅ **Approved:** The customer approved the current MVP v1.0 increment.
* ✅ **UI Praised:** Customer expressed high satisfaction with UI design, table display, and frontend quality — *"respect to the guys"* [26:29–26:46].
* 🔄 **Requested:** Oracle connector as highest priority for real-world testing on production data.
* 🔄 **Requested:** Local deployment instructions to be delivered by Friday.
* 🔄 **Requested:** Customer agreed to provide written markdown feedback after testing on own databases.

---

## Risks & Open Items
| Risk | Severity | Mitigation |
|---|---|---|
| Oracle connector blocks customer's real-world validation | High | Prioritized as Must Have for Sprint 2 (PBI-032) |
| Free-tier remote test database has stability issues | Medium | Recommend customer use local Docker deployment |
| Chat storage partially in-memory (`MOCK_CHATS` dict) | Medium | Migrate to persistent `Chat`/`Draft` DB models in Sprint 2 |
| Catalog credentials stored in plaintext | Medium | Implement encryption-at-rest in Sprint 2 |
| CI lacks build/test gates (only Lychee) | Medium | Add `pytest` and `tsc -b` CI workflows in Sprint 2 |

---

## Action Points
1. Deliver deployment guide and repository access to the customer by Friday.
2. Add Oracle DBMS connector support (PBI-032).
3. Fix UI bugs: input blocking (PBI-020), option override (PBI-021), password validation (PBI-026).
4. Hide admin-only controls from regular users (PBI-027).
5. Implement deferred chat title synthesis (PBI-023).
6. Plan next meeting after customer's weekend testing.

---

## Resulting Product Backlog Changes
* **15 new PBIs added:** PBI-019 through PBI-033 (56 Story Points total).
* **Sprint 2 scope:** 13 PBIs covering bug fixes, UI features, Oracle connector, and deployment guide.
* **Deferred to MVP v3:** PBI-030 (admin analytics dashboard) and PBI-031 (LLM config in admin panel).
