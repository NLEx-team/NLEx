# Customer Handover Documentation

## Product Overview

NLEx (Natural Language To Excel) is a web-based platform that enables non-technical users to query structured databases using natural language. It translates everyday questions into SQL queries via LLMs and executes them across multiple database types through the Trino query engine.

**Repository**: [https://github.com/NLEx-team/NLEx](https://github.com/NLEx-team/NLEx)

**Hosted Documentation**: [https://nlex-team.github.io/NLEx/](https://nlex-team.github.io/NLEx/)

**License**: MIT

---

## Current Handover Status

| Attribute | Value |
|-----------|-------|
| **Handover Level** | `Ready for independent use` |
| **Customer-Confirmation Status** | `Not yet accepted` |

The product is feature-complete for core use cases and has been demonstrated to the customer. The customer has confirmed the product looks like "a solid solution" and plans to deploy it locally for testing against production databases. Independent customer testing has not yet occurred as of the end of Week 6.

---

## What Has Been Transferred

### Repository Access
- The customer has full access to the GitHub repository
- A stable release-candidate branch has been prepared for customer independent testing
- All source code is open under the MIT License

### Documentation
- **Hosted documentation site**: [https://nlex-team.github.io/NLEx/](https://nlex-team.github.io/NLEx/) (MkDocs Material)
- **Repository README**: Setup, configuration, and quick-start instructions
- **Architecture documentation**: System overview, component descriptions, and Architecture Decision Records (ADRs)
- **Contributing guidelines**: `CONTRIBUTING.md` with development workflow, code style, and PR process

### Deployed Instance
- A team-managed deployment is accessible at: [https://nlex.tech](https://nlex.tech)
- The customer is expected to deploy their own instance for production use

---

## Environment Variables and Configuration

The application is configured via environment variables defined in a `.env` file. A template is provided at `.env.example` in the repository root.

### Required Configuration

| Variable | Purpose | Notes |
|----------|---------|-------|
| `DATABASE_URL` | PostgreSQL connection for application data | Customer must provide their own PostgreSQL instance |
| `OPENAI_API_KEY` | API key for the LLM provider | Customer uses their own model and key |
| `OPENAI_BASE_URL` | LLM service endpoint | Supports OpenAI-compatible APIs and local models |
| `LLM_MODEL_SQL` / `LLM_MODEL_INFERENCE` | Model identifiers | SQL generation model and relationship inference model (default: `gpt-5.4-mini` for both) |
| `TRINO_HOST` / `TRINO_PORT` | Trino query engine connection | Included in Docker Compose setup |
| `JWT_SECRET_KEY` | Application secret for session management | Customer must generate their own |
| `FRONTEND_PORT` | Frontend service port | Default: `5173` |
| `BACKEND_PORT` | Backend service port | Default: `8000` |
| `ADMIN_EMAIL` | Admin account email | Required to log in to the admin dashboard |
| `ADMIN_PASSWORD` | Admin account password | Required to log in to the admin dashboard |

See `.env.example` in the repository root for the complete list with default values. **No secrets are stored in the repository.**

---

## Setup, Deployment, and Verification

### Quick Start (Docker Compose)

```bash
# 1. Clone the repository
git clone https://github.com/NLEx-team/NLEx.git
cd NLEx

# 2. Copy and configure environment
cp .env.example .env.secret
# Edit .env.secret with your LLM keys, database credentials, JWT secret, and admin credentials.
# IMPORTANT: For local deployment, ensure VITE_API_URL is set to http://localhost:8000 (defaults to https://api.nlex.tech in .env.example)

# 3. Start all services (development mode)
docker compose --env-file .env.secret --profile dev up --build

# 4. Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
```

### Production Mode

```bash
docker compose --env-file .env.secret --profile prod up --build
# Frontend: http://localhost:5173 (or as configured in FRONTEND_PORT)
# Backend API: http://localhost:8000
```

### Verification Steps

1. **Frontend loads**: Navigate to `http://localhost:5173` — the login page should appear
2. **Registration/Login**: Create an account or log in with existing credentials
3. **Database connection**: Add a database connection — status indicator should transition from yellow to green
4. **Natural language query**: Type a question in natural language — the system should generate SQL and return results
5. **Admin features**: Log in as admin to verify analytics dashboard and user management access

### Recovery

If services fail to start:
```bash
# Check service logs
docker compose logs

# Restart all services
docker compose --profile dev down
docker compose --env-file .env.secret --profile dev up --build

# Reset database (caution: deletes all data)
docker compose --profile dev down -v
docker compose --env-file .env.secret --profile dev up --build
```

### Per-Service Configuration (DevOps/Orchestration)

For independent service deployment, each service requires its own configuration:

| Service | Technology | Default Port | Key Configuration |
|---------|-----------|-------------|-------------------|
| **Frontend** | React/TypeScript/Vite | 5173 (dev) / 5173 (prod default) | `VITE_API_URL` (backend endpoint) |
| **Backend** | Python/FastAPI | 8000 | `DATABASE_URL`, `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `TRINO_HOST`, `JWT_SECRET_KEY` |
| **PostgreSQL** | PostgreSQL 16 | 5432 | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` |
| **Trino** | Trino 481 | 8080 | Config properties file (`trino-config.properties`), database catalog configurations |

> **Note**: Kubernetes support and its deployment guides have been deprecated based on changing project scope. Per-service configuration details are provided in [docs/deployment/per-service.md](deployment/per-service.md).

---

## Documentation Entry Points

| Document | Purpose | Location |
|----------|---------|----------|
| **README.md** | Main entry point, quick-start setup | Repository root |
| **Hosted Docs** | Full documentation site | [nlex-team.github.io/NLEx](https://nlex-team.github.io/NLEx/) |
| **Quality Requirements** | Non-functional requirements (performance, security, usability) | `docs/quality-requirements.md` |
| **Testing Strategy** | Test approach, tools, coverage, and instructions | `docs/testing.md` |
| **User Acceptance Tests** | UAT scenarios and results | `docs/user-acceptance-tests.md` |
| **Roadmap** | Version history and planned work | `docs/roadmap.md` |
| **Contributing** | Development workflow and guidelines | `CONTRIBUTING.md` |

---

## Known Limitations

1. **Chart generation preview**: The customer requested chart generation (in-app preview + Excel export). We heavily optimized the Excel export functionality (now 3-5x faster with rich download animations), but the in-app chart preview UI remains a planned enhancement.
2. **VPN/certificate handling**: If the customer needs to connect to databases accessible only via VPN, custom CA certificates must be added to the Docker images manually.
3. **Performance at scale not validated**: The product has been tested with development-scale databases. Performance with production-scale databases (hundreds of GB, billions of rows) has not been validated. The customer plans to conduct this testing.
4. **MCP integration not available**: The customer expressed interest in Model Context Protocol integration for DB-specific query optimization (e.g., knowing when to use `GROUP BY` instead of `DISTINCT` in ClickHouse). This is architecturally complex and not planned for the current course timeline.
5. **Language mixing edge cases**: When a chat's language is set to one language but the user writes prompts in another, the LLM response language may be inconsistent.

---

## Troubleshooting

| Issue | Likely Cause | Solution |
|-------|-------------|----------|
| Services fail to start | Missing or incorrect `.env.secret` configuration | Verify `.env.secret` against `.env.example`; check Docker is running; verify port availability |
| Database connection fails | Wrong credentials or unreachable host | Verify database credentials and network accessibility; check Trino catalog configuration |
| LLM not responding | Invalid API key or unreachable endpoint | Verify `OPENAI_API_KEY` and `OPENAI_BASE_URL`; check model endpoint reachability |
| Schema not loading for new database | Connection issue during vectorization | Delete and re-add the database connection; schema is rebuilt at initial connection |
| Translation inconsistencies | i18n coverage gap | Switch language via UI settings and report any remaining issues via GitHub Issues |
| Frontend shows blank page | Backend not reachable | Check `VITE_API_URL` environment variable; verify backend is running on expected port |
| Query returns wrong results | LLM misinterpretation or schema mismatch | Try rephrasing the question; verify the connected database schema is correct |

---

## Support

**During the course period:**
- GitHub Issues: [https://github.com/NLEx-team/NLEx/issues](https://github.com/NLEx-team/NLEx/issues)
- Direct communication via Telegram

**After the course:**
- The product is self-contained and can be maintained using the documentation and contributing guidelines provided in the repository
- No ongoing team support is guaranteed after course completion

---

## Documentation Sufficiency Assessment

The current documentation set is **sufficient for the reached handover level** (`Ready for independent use`), with the following caveats:

- Docker Compose deployment is fully documented and has been validated by the customer.
- Per-service deployment configuration guidelines are now documented (Kubernetes support is deprecated).
- VPN certificate installation documentation is pending.

The customer has confirmed that previous deployment documentation was clear enough for independent deployment. Additional documentation for production-specific needs (per-service configuration, performance tuning) is being developed based on customer feedback.

---

## Pending Transition Actions

Since the customer meeting for Week 7 has not yet been conducted, the following actions are still pending:
1. Support the customer's local deployment attempt with production databases, ensuring they successfully run the system using the provided configuration guides.
2. Document VPN certificate installation for Docker images if required by the customer's final environment.
3. Gather and address customer feedback from production-scale testing.
4. Confirm final transition acceptance with the customer.
