# Reflection — Week 4

## Learning points
- **Customer Feedback Is a Feature Multiplier:** The single Sprint Review session with the customer generated 15 new PBIs — more than the entire original Sprint 1 backlog. Watching a real user interact with the system revealed usability issues (blocked input field, missing database selector, role-based visibility) that the team had never encountered during internal testing.
- **Quality Requirements Require Upfront Design:** Defining ISO/IEC 25010 quality requirements retroactively was harder than expected. The team discovered that measurable quality scenarios (e.g., response time thresholds, authentication security standards) should ideally be defined during Sprint Planning, not after the increment is delivered.
- **Automated Testing Reveals Architectural Gaps:** Writing integration tests for the orchestrator service exposed that chat state is stored in-memory, making tests dependent on execution order. This validated the need to migrate to persistent storage — the `Chat` and `Draft` database models already exist in the ORM layer but are not yet wired into the chat controller.
- **CI Is Only as Strong as Its Weakest Gate:** The existing Lychee link-checking CI workflow caught documentation issues but missed TypeScript build errors and Python test failures that were only discovered manually. This confirmed that a single-check CI pipeline provides false confidence.

## Validated assumptions
- **LLM Clarification Dialogue Works:** The assumption that GPT-4o-mini can reliably detect ambiguous queries and generate structured clarification options was validated during the customer demo. The customer found the button-based clarification flow intuitive and efficient.
- **Schema Caching Is Acceptable:** The customer explicitly approved the approach of caching database schemas in the LLM context rather than making fresh SQL queries to the database for every request — *"using the cache is fine"* [05:52]. This validated our performance optimization strategy.
- **Docker Multi-Profile Setup Scales:** The `dev`/`prod`/`test` Docker Compose profiles successfully isolated environments throughout the sprint, confirming this architecture for Sprint 2.
- **Trino Abstraction Layer Is Correct:** The customer validated the use of Trino as a distributed query engine to decouple database-specific connection logistics from the LLM prompt architecture, confirming this is the right path for cross-database queries in MVP v2.

## Friction and gaps
- **Oracle Connector Blocks Real-World Testing:** The customer's production databases run on Oracle, which NLEx does not yet support. This blocks the most valuable validation opportunity: testing on real, complex enterprise data. PBI-032 (Oracle connector) is now the highest-priority Sprint 2 item.
- **Missing Build/Test CI Gates:** The CI pipeline lacks `npm run build`, `eslint`, and `pytest` steps. PRs can be merged with broken TypeScript or failing Python tests. This is the most critical process gap.
- **Chat Persistence Gap:** The in-memory `MOCK_CHATS` storage means all conversation history is lost on server restart. The database models (`Chat`, `Draft`) exist but are not wired into the chat controller.
- **Credential Security:** Catalog connection passwords are stored in plaintext in the application database. This must be addressed before any production-like deployment.
- **Frontend Test Coverage:** There are currently zero frontend tests. The React/TypeScript codebase has no unit tests, component tests, or E2E tests.

## Planned response
- **Sprint 2 CI Expansion:** Add GitHub Actions workflows for backend tests (`pytest`), frontend build (`tsc -b && vite build`), and frontend linting (`eslint`). These will be required to pass before any PR can be merged.
- **Oracle Connector:** Prioritize Oracle DBMS support as the first Sprint 2 deliverable to unblock customer validation on production data.
- **Chat Persistence Migration:** Wire the existing `Chat` and `Draft` database models into the chat controller to replace the in-memory `MOCK_CHATS` store.
- **Credential Encryption:** Implement encryption-at-rest for catalog connection passwords using `cryptography.fernet` or equivalent.
- **Frontend Testing Foundation:** Introduce `vitest` and `@testing-library/react` for component-level tests on critical UI paths (chat input, clarification buttons, database selector).
