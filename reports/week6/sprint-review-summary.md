# Sprint 4 Review Summary

## Sprint Information

- **Sprint**: Sprint 4 (Week 6)
- **Sprint Dates**: June 30, 2026 – July 6, 2026
- **Sprint Goal**: Deliver a stable trial release with UX/UI improvements, admin panel enhancements, translation fixes, and customer-facing documentation, enabling the customer to independently deploy and test the product.

## Sprint Goal Achievement

✅ **Achieved** — Trial release v2.1.0 was delivered with all planned UI/UX improvements, admin enhancements, translation fixes, and initial customer-facing documentation. The product is ready for customer independent testing.

## Demonstrated Items

1. **Chat Folder Organization** — Users can create folders and group chats by topic (e.g., traffic queries, company reports). Chats can also exist outside folders.
2. **Minimalist Chat UI** — Interface redesigned to follow modern chatbot UX patterns (inspired by ChatGPT, Claude, Perplexity) with smaller icons and cleaner layout.
3. **Admin User Table Filtering/Sorting** — Added filters for email, name, registration date, and query count. Sorting toggles between fields (selecting email sort disables name sort, and vice versa).
4. **Translation Fixes** — Resolved inconsistencies such as "successfully" appearing in Russian-language UI mode.
5. **Database Connection Flow** — Demonstrated the improved connection flow: schema vectorization happens at initial connection, with yellow→green status indicators.
6. **Cascading Database Deletion** — Demonstrated that deleting a database removes its vector representation, schema, and Trino catalog.
7. **Per-Service Deployment Documentation** — Initial documentation structure for deploying services individually (Kubernetes/DevOps use case).
8. **Customer Handover Documentation** — Created `docs/customer-handover.md` with setup, configuration, troubleshooting, and transition guidance.
9. **Architecture Diagram** — Added to the hosted GitHub Pages documentation site.

## Customer Feedback

The Sprint 4 Review was conducted with customer **Nikita Maksimenko** during the same meeting as the transition-readiness discussion and customer trial planning.

### Positive Feedback:
- The customer described the product as **"a solid solution"** and confirmed it looks ready for use
- Previous deployment instructions were confirmed as clear — the customer was able to deploy locally without problems using the provided documentation
- The customer is interested in production testing with real databases (hundreds of GB, billions of rows)

### Requested Changes:
- **Chart generation** — ability to build charts from query results, both as in-app preview and in Excel exports. Acknowledged by the team as resource-intensive; deferred to Sprint 5.
- **Per-service configuration docs** — for Kubernetes deployment, each service needs separate documentation (Deployment, ConfigMap, Secrets)
- **Stable branch delivery** — customer needs a stable branch sent via Telegram for independent deployment and testing

### Additional Customer Plans:
- Customer will deploy the product locally using VPN to connect to production databases
- Customer will perform performance testing with large-scale data (e.g., ClickHouse tables with 1.6B rows, 25 GB)
- Customer expressed interest in MCP integration for DB-specific query optimization (acknowledged as complex, deferred)

## Follow-up Actions for Sprint 5

| # | Action | Owner | Priority |
|---|--------|-------|----------|
| 1 | Send stable release-candidate branch to customer via Telegram | Serafim | 🔴 High |
| 2 | Support customer's local deployment (VPN certificates, configuration) | Serafim, Maksim | 🔴 High |
| 3 | Complete per-service deployment documentation | Serafim | 🟡 Medium |
| 4 | Implement chart generation (if feasible) | Maksim, Mikhail | 🟡 Medium |
| 5 | Address issues from customer's production testing | All | 🟡 Medium |
| 6 | Final transition and MVP v3 delivery | All | 🔴 High |
| 7 | Demo Day preparation (slides, recorded demo) | All | 🟡 Medium |
