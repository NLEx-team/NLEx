# Sprint 4 Retrospective

## What Went Well

- Delivered all Sprint 4 PBIs and created trial release v2.1.0 on schedule
- Customer confirmed the product is **"a solid solution"** — strong validation of the development direction
- UI/UX improvements (chat folders, minimalist design, admin filtering) were well received by the customer
- Translation fixes resolved the reported inconsistencies across the application
- GitHub Pages documentation site is live, accessible, and acknowledged by the customer
- Sprint velocity maintained at 29 Story Points (consistent with previous Sprint)
- Customer handover documentation (`docs/customer-handover.md`) was created with comprehensive deployment and configuration guidance
- The team demonstrated cascading database deletion and schema vectorization flow, which impressed the customer

## What Didn't Go Well

- **Stable branch not sent to customer before the meeting** — this was the biggest missed opportunity, as it delayed customer independent testing by at least a week
- **Per-service deployment documentation is still incomplete** — only the initial structure was created; full Kubernetes-ready per-service ConfigMap/Secrets documentation is needed
- **Customer handover documentation was created late** — it should have been started in an earlier Sprint to allow iterative refinement
- **Chart generation feature had to be deferred** — while this was the right prioritization call, it means Sprint 5 has significant feature work alongside transition tasks
- **No performance testing with large-scale databases** — the product has only been tested with development-scale data; production-scale testing depends on customer
- **VPN/certificate handling not documented** — the customer specifically mentioned needing to drop certificates into Docker images, and we have no documentation for this

## Action Items

| # | Action | Owner | Target |
|---|--------|-------|--------|
| 1 | Send stable release-candidate branch to customer via Telegram | Serafim | Start of Week 7 |
| 2 | Complete per-service deployment documentation for Kubernetes | Serafim | Mid Week 7 |
| 3 | Document VPN certificate installation for Docker images | Serafim | Mid Week 7 |
| 4 | Implement chart generation feature (if feasible) | Maksim, Mikhail | End of Week 7 |
| 5 | Update customer handover docs with final deployment details | Maksim | End of Week 7 |
| 6 | Support customer during local deployment and testing | All | Week 7 |
| 7 | Prepare for and respond to performance test feedback | All | Week 7 |
| 8 | Prepare Demo Day presentation and record demo video | All | End of Week 7 |
