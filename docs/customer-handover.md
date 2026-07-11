# Customer Handover Documentation

## Product Overview

NLEx (Natural Language Explorer) is a web-based platform that enables non-technical users to query structured databases using natural language. It translates everyday questions into SQL queries via LLMs and executes them across multiple database types through the Trino query engine.

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
- **Agent guidance**: `AGENTS.md` with AI/LLM contributor constraints

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
| `LLM_API_KEY` | API key for the LLM provider | Customer uses their own model and key |
| `LLM_API_URL` | LLM service endpoint | Supports OpenAI-compatible APIs and local models |
| `LLM_MODEL` | Model identifier | e.g., `gpt-4`, or a local model name |
| `TRINO_HOST` / `TRINO_PORT` | Trino query engine connection | Included in Docker Compose setup |
| `SECRET_KEY` | Application secret for session management | Customer must generate their own |
| `FRONTEND_PORT` | Frontend service port | Default: `5173` |
| `BACKEND_PORT` | Backend service port | Default: `8000` |

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
# Edit .env.secret with your LLM API key, database credentials, and secret key

# 3. Start all services (development mode)
docker compose --env-file .env.secret --profile dev up --build

# 4. Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
```

### Production Mode

```bash
docker compose --env-file .env.secret --profile prod up --build
# Frontend: http://localhost:80
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

### Per-Service Configuration (Kubernetes/DevOps)

For production Kubernetes deployment, each service requires its own configuration:

| Service | Technology | Default Port | Key Configuration |
|---------|-----------|-------------|-------------------|
| **Frontend** | React/TypeScript/Vite | 5173 (dev) / 80 (prod) | `VITE_API_URL` (backend endpoint) |
| **Backend** | Python/FastAPI | 8000 | `DATABASE_URL`, `LLM_API_KEY`, `LLM_API_URL`, `TRINO_HOST`, `SECRET_KEY` |
| **PostgreSQL** | PostgreSQL 16 | 5432 | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` |
| **Trino** | Trino 481 | 8080 | Config properties file (`trino-config.properties`), database catalog configurations |

> **Note**: Detailed per-service Kubernetes deployment documentation (Deployment, ConfigMap, Secrets manifests) is being developed and will be completed in Week 7.

---

## Documentation Entry Points

| Document | Purpose | Location |
|----------|---------|----------|
| **README.md** | Main entry point, quick-start setup | Repository root |
| **Hosted Docs** | Full documentation site | [nlex-team.github.io/NLEx](https://nlex-team.github.io/NLEx/) |
| **Architecture** | System overview, static/dynamic/deployment views, ADRs | `docs/architecture/` |
| **Quality Requirements** | Non-functional requirements (performance, security, usability) | `docs/quality-requirements.md` |
| **Testing Strategy** | Test approach, tools, coverage, and instructions | `docs/testing.md` |
| **User Acceptance Tests** | UAT scenarios and results | `docs/user-acceptance-tests.md` |
| **Roadmap** | Version history and planned work | `docs/roadmap.md` |
| **Contributing** | Development workflow and guidelines | `CONTRIBUTING.md` |
| **Agent Guidance** | AI/LLM contributor constraints | `AGENTS.md` |

---

## Known Limitations

1. **No chart generation yet**: The customer requested chart generation (in-app preview + Excel export). This is planned for Sprint 5 / MVP v3 if time permits.
2. **Docker Compose only**: Deployment is currently supported only via Docker Compose. Kubernetes manifests and per-service configuration documentation are in progress.
3. **VPN/certificate handling**: If the customer needs to connect to databases accessible only via VPN, custom CA certificates must be added to the Docker images manually. Documentation for this is being prepared.
4. **Performance at scale not validated**: The product has been tested with development-scale databases. Performance with production-scale databases (hundreds of GB, billions of rows) has not been validated. The customer plans to conduct this testing.
5. **MCP integration not available**: The customer expressed interest in Model Context Protocol integration for DB-specific query optimization (e.g., knowing when to use `GROUP BY` instead of `DISTINCT` in ClickHouse). This is architecturally complex and not planned for the current course timeline.
6. **Language mixing edge cases**: When a chat's language is set to one language but the user writes prompts in another, the LLM response language may be inconsistent.

---

## Troubleshooting

| Issue | Likely Cause | Solution |
|-------|-------------|----------|
| Services fail to start | Missing or incorrect `.env.secret` configuration | Verify `.env.secret` against `.env.example`; check Docker is running; verify port availability |
| Database connection fails | Wrong credentials or unreachable host | Verify database credentials and network accessibility; check Trino catalog configuration |
| LLM not responding | Invalid API key or unreachable endpoint | Verify `LLM_API_KEY` and `LLM_API_URL`; check model endpoint reachability |
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
- The product is self-contained and can be maintained using the documentation, contributing guidelines, and agent guidance provided in the repository
- No ongoing team support is guaranteed after course completion

---

## Documentation Sufficiency Assessment

The current documentation set is **sufficient for the reached handover level** (`Ready for independent use`), with the following caveats:

- Docker Compose deployment is fully documented and has been validated by the customer
- Kubernetes/per-service deployment documentation is in progress and will be completed in Week 7
- VPN certificate installation documentation is pending

The customer has confirmed that previous deployment documentation was clear enough for independent deployment. Additional documentation for production-specific needs (per-service configuration, performance tuning) is being developed based on customer feedback.

---

## What Still Needs to Happen (Week 7)

1. Send stable release-candidate branch to the customer
2. Support customer's local deployment attempt with production databases
3. Complete per-service deployment documentation for Kubernetes
4. Document VPN certificate installation for Docker images
5. Gather and address customer feedback from production-scale testing
6. Deliver final `MVP v3` release
7. Confirm transition acceptance with customer
