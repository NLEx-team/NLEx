# NLEx Product Roadmap

## Released Versions

### MVP v1 (v1.0.0)

Released June 14, 2026.

- Natural language query input and SQL generation via LLM
- Result preview table and SQL preview component
- Clarification logic with UI support for ambiguous queries
- Persistent database connection management (PostgreSQL)
- Secure JWT-based authentication and user management

### Sprint 2 Release (v1.2.0)

Released June 28, 2026.

- Oracle DBMS connector for Trino
- Explicit database selector control before query submission
- Large-result file export to `.xlsx`
- DBMS type selector in "Add Database" admin form
- "Check Connection" button for regular users
- Database server latency indicator
- Comprehensive local deployment guide

### MVP v2 (v2.0.0)

Released July 5, 2026.

- Cross-database request capabilities (query multiple database targets)
- Admin Panel for administrative controls and environment configuration
- Persistent history of past requests in the chat interface
- All template-related features deprecated based on changed product vision

### Sprint 4 Trial Release (v2.1.0)

Released July 6, 2026. Week 6 trial/handover-candidate release for Assignment 6.

- Chat folder organization for grouping conversations
- Sorting and filtering in admin user table (email, name, date, queries)
- Minimalist chat UI redesign (inspired by ChatGPT/Perplexity)
- Translation fixes across the application
- Stable release-candidate branch for customer testing
- Per-service deployment documentation (initial)
- Customer handover documentation
- Architecture diagram added to hosted docs

## Current Version: v2.1.0 (Sprint 4 Trial Release)

The product is feature-complete for core use cases and ready for customer independent testing.

## Next: MVP v3 (Target: Week 7)

### Planned Scope:
- Customer deployment support (stable branch delivery, VPN certificate documentation)
- Chart generation: in-app preview and Excel export (if feasible within timeline)
- Complete per-service deployment documentation for Kubernetes
- Address customer feedback from production-scale database testing
- Final transition and handover confirmation
- Demo Day preparation (presentation, recorded demo)

### Quality & Process Goals:
- Complete and finalize customer handover documentation
- Execute UATs with customer participation (independent deployment scenario)
- Finalize all deployment documentation
- Obtain transition acceptance from customer

## Post-Course Outlook

The project will be handed over to the customer. The product is self-contained and can be maintained independently using the provided documentation. Future development depends on customer needs and may include:

- Advanced query optimization with DB-specific knowledge bases
- MCP (Model Context Protocol) integration for ClickHouse and PostgreSQL
- Performance benchmarking and optimization for production-scale databases
- Extended chart and visualization capabilities
- Additional database connector support

*(Note: All previously planned template-related features were deprecated due to a change in product vision.)*
