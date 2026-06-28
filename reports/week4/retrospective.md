# Sprint Retrospective — Week 4 (Sprint 1)

## What went well
1. **Successful MVP v1.0 Delivery:** The team delivered a complete, functional end-to-end NL2SQL service on time. The customer tested the live deployment and expressed high satisfaction with both the UI design and core functionality.
2. **Customer Engagement:** The Sprint Review with the customer produced 15 concrete, actionable feedback items that were immediately translated into new PBIs (PBI-019 through PBI-033). This level of engagement validates the product direction.
3. **Comprehensive Test Suite:** The backend test suite grew to 14 test files covering critical modules — authentication, user management, orchestrator state machine, schema service, LLM service, and distributed database operations — providing a solid regression safety net.
4. **Stable Deployment Pipeline:** The Docker Compose multi-profile setup (`dev`/`prod`/`test`) worked reliably throughout the sprint, enabling consistent environments across the team. The production deployment at [nlex.tech](https://nlex.tech) remained stable during the customer demo.

## What did not go well
1. **Missing CI Build Gate:** Despite the Week 3 action point to add `npm run build` checks to GitHub Actions, the CI pipeline still only runs Lychee link checking. TypeScript build errors and Python test failures could still be merged without automated detection.
2. **In-Memory Chat Storage:** Chat sessions are stored in an in-memory dictionary (`MOCK_CHATS`) rather than persisted to the existing database models (`Chat`, `Draft`). All conversation history is lost on server restart.
3. **Incomplete Role-Based UI:** Admin-only controls (e.g., the "Delete Database" button) are rendered for all users. The customer discovered this during testing, creating a poor impression of access control maturity.
4. **Plaintext Credentials:** Database catalog credentials (user/password) are stored in plaintext in the application database, posing a security risk that was deferred but not yet addressed.

## What we changed compared to the previous Sprint based on the previous Sprint Retrospective
1. **Documentation Placement (Week 3 Action Point):** Following the action point about misplaced artifacts, all Week 4 documentation was placed in the correct directories from the start (`reports/week4/`, `docs/`). No repositioning was needed.
2. **Architecture Understanding (Week 3 Action Point):** The team's understanding of the Vercel → VPS → VM deployment architecture improved significantly, reducing infrastructure-related confusion and deployment delays compared to Week 3.

## Concrete process improvements for the next Sprint
1. **Add CI Build & Test Gate:** Implement a GitHub Actions workflow that runs `npm run build` (frontend) and `pytest` (backend) on every PR targeting `develop` or `main`. Block merges on failure. This directly addresses the unresolved Week 3 action point.
2. **Mandatory Acceptance Criteria Checklist:** Before marking any PBI as Done, the reviewer must explicitly verify each acceptance criterion in the PR description using a checkbox checklist format. This ensures no criterion is silently skipped during code review.
