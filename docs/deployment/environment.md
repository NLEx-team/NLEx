# Environment Variables Reference

Complete reference for all NLEx environment variables. Variables are loaded from `.env.secret` (Docker Compose) or Kubernetes Secrets / ConfigMaps.

---

## Variable Reference

### Frontend

| Variable | Required | Default | Description | Security |
|---|---|---|---|---|
| `VITE_API_URL` | ✅ | — | Backend API base URL (e.g., `http://localhost:8000`). **Baked at build time** — cannot be changed at runtime. | None |

!!!warning "Build-time only"
    `VITE_API_URL` is injected by Vite during `npm run build`. Changing it requires rebuilding the frontend container image. There is no runtime override.

---

### Backend

| Variable | Required | Default | Description | Security |
|---|---|---|---|---|
| `APP_HOST` | ❌ | `0.0.0.0` | Host address for Uvicorn to bind to. | None |
| `APP_PORT` | ❌ | `8000` | Port for Uvicorn to listen on. | None |
| `CORS_ORIGINS` | ✅ | — | Comma-separated list of allowed CORS origins (e.g., `http://localhost:5173,https://nlex.example.com`). | None |
| `LOG_LEVEL` | ❌ | `info` | Logging level: `debug`, `info`, `warning`, `error`. | None |
| `WORKERS` | ❌ | `1` | Number of Uvicorn worker processes (production: set to CPU count). | None |

---

### Database (PostgreSQL)

| Variable | Required | Default | Description | Security |
|---|---|---|---|---|
| `DATABASE_URL` | ✅ | — | Full PostgreSQL connection string (e.g., `postgresql+asyncpg://user:pass@host:5432/db`). | 🔐 Contains password |
| `POSTGRES_USER` | ✅ | — | PostgreSQL superuser name (used by the `postgres` container on first start). | None |
| `POSTGRES_PASSWORD` | ✅ | — | PostgreSQL superuser password. | 🔐 Secret |
| `POSTGRES_DB` | ✅ | — | Database name to create on first start. | None |
| `POSTGRES_HOST` | ❌ | `postgres` | PostgreSQL hostname (used when `DATABASE_URL` is composed dynamically). | None |
| `POSTGRES_PORT` | ❌ | `5432` | PostgreSQL port. | None |

!!!tip "DATABASE_URL format"
    The backend uses SQLAlchemy with the `asyncpg` driver. The connection string format is:
    ```
    postgresql+asyncpg://<user>:<password>@<host>:<port>/<database>
    ```

---

### Trino

| Variable | Required | Default | Description | Security |
|---|---|---|---|---|
| `TRINO_HOST` | ✅ | — | Trino coordinator hostname (e.g., `trino` or `localhost`). | None |
| `TRINO_PORT` | ❌ | `8080` | Trino HTTP port. | None |
| `TRINO_USER` | ❌ | `nlex` | Username for Trino connections (used in query attribution). | None |
| `TRINO_CATALOG_DIR` | ❌ | `/etc/trino/catalog` | Directory where catalog `.properties` files are written. Must be shared with the Trino container. | None |

---

### Authentication (Auth)

| Variable | Required | Default | Description | Security |
|---|---|---|---|---|
| `JWT_SECRET_KEY` | ✅ | — | Secret key for signing and verifying JWT access tokens. Must be at least 32 characters. | 🔐 Secret — must be identical across all backend replicas |
| `JWT_ALGORITHM` | ❌ | `HS256` | JWT signing algorithm. | None |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ❌ | `30` | Access token lifetime in minutes. | None |
| `REFRESH_TOKEN_EXPIRE_DAYS` | ❌ | `7` | Refresh token lifetime in days. | None |
| `FIRST_ADMIN_EMAIL` | ❌ | — | Email for the initial admin account created on first startup. | None |
| `FIRST_ADMIN_PASSWORD` | ❌ | — | Password for the initial admin account. | 🔐 Secret |

!!!note "First admin account"
    If `FIRST_ADMIN_EMAIL` and `FIRST_ADMIN_PASSWORD` are set, the backend will create an admin user on the first startup (if no users exist). Remove these variables after the initial setup.

---

### LLM Configuration

| Variable | Required | Default | Description | Security |
|---|---|---|---|---|
| `OPENAI_API_KEY` | ✅ | — | API key for the LLM provider (OpenAI or compatible). | 🔐 Secret |
| `OPENAI_BASE_URL` | ❌ | `https://api.openai.com/v1` | LLM API endpoint. Supports any OpenAI-compatible API. | None |
| `LLM_MODEL_SQL` | ❌ | `gpt-5.4-mini` | Model used for SQL query generation (called per user request). | None |
| `LLM_MODEL_INFERENCE` | ❌ | `gpt-5.4-mini` | Model used for database relationship inference (called once during schema sync). | None |
| `MAX_SQL_RETRIES` | ❌ | `3` | Number of retry attempts for failed SQL generation. | None |
| `SYSTEM_PROXY_URL` | ❌ | — | HTTP proxy URL for LLM API requests. | None |

---

## Security Summary

!!!warning "Variables marked 🔐 must be protected"

| Variable | Risk if Exposed |
|---|---|
| `DATABASE_URL` | Full database access |
| `POSTGRES_PASSWORD` | Full database access |
| `JWT_SECRET_KEY` | Token forgery — full impersonation |
| `FIRST_ADMIN_PASSWORD` | Admin account takeover |
| `OPENAI_API_KEY` | Unauthorized LLM usage and billing |

**Best practices:**

- **Docker Compose**: Use `.env.secret` and add it to `.gitignore`. Never commit secrets.
- **Kubernetes**: Use `Secret` resources (or external secret managers like Vault, AWS Secrets Manager).
- **CI/CD**: Inject secrets via pipeline variables, never hardcode them in manifests.

---

## Example Configurations

### Local Development

```bash
# .env.secret — Local development with Docker Compose

# Frontend
VITE_API_URL=http://localhost:8000

# Database
POSTGRES_USER=nlex
POSTGRES_PASSWORD=nlex_dev_password
POSTGRES_DB=nlex_db
DATABASE_URL=postgresql+asyncpg://nlex:nlex_dev_password@postgres:5432/nlex_db

# Trino
TRINO_HOST=trino
TRINO_PORT=8080

# Auth
JWT_SECRET_KEY=dev-secret-key-change-in-production-minimum-32-chars
ACCESS_TOKEN_EXPIRE_MINUTES=60
FIRST_ADMIN_EMAIL=admin@localhost
FIRST_ADMIN_PASSWORD=admin123

# Backend
CORS_ORIGINS=http://localhost:5173
LOG_LEVEL=debug
```

---

### Production with OpenAI

```bash
# .env.secret — Production with OpenAI GPT-4o

# Frontend
VITE_API_URL=https://api.nlex.example.com

# Database
POSTGRES_USER=nlex
POSTGRES_PASSWORD=<strong-random-password>
POSTGRES_DB=nlex_db
DATABASE_URL=postgresql+asyncpg://nlex:<strong-random-password>@postgresql:5432/nlex_db

# Trino
TRINO_HOST=trino
TRINO_PORT=8080

# Auth
JWT_SECRET_KEY=<generate-with-openssl-rand-hex-32>
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
FIRST_ADMIN_EMAIL=admin@example.com
FIRST_ADMIN_PASSWORD=<strong-admin-password>

# Backend
CORS_ORIGINS=https://nlex.example.com
LOG_LEVEL=warning
WORKERS=4

# LLM — OpenAI
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LLM_MODEL_SQL=gpt-5.4-mini
LLM_MODEL_INFERENCE=gpt-5.4-mini
MAX_SQL_RETRIES=3
```

---

### Production with DeepSeek

```bash
# .env.secret — Production with DeepSeek

# Frontend
VITE_API_URL=https://api.nlex.example.com

# Database
POSTGRES_USER=nlex
POSTGRES_PASSWORD=<strong-random-password>
POSTGRES_DB=nlex_db
DATABASE_URL=postgresql+asyncpg://nlex:<strong-random-password>@postgresql:5432/nlex_db

# Trino
TRINO_HOST=trino
TRINO_PORT=8080

# Auth
JWT_SECRET_KEY=<generate-with-openssl-rand-hex-32>
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Backend
CORS_ORIGINS=https://nlex.example.com
LOG_LEVEL=warning
WORKERS=4

# LLM — DeepSeek
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LLM_MODEL_SQL=deepseek-chat
LLM_MODEL_INFERENCE=deepseek-chat
MAX_SQL_RETRIES=3
```

---

### Self-Hosted LLM (vLLM / Ollama)

```bash
# .env.secret — Self-hosted LLM (e.g., vLLM serving Llama)

# Frontend
VITE_API_URL=https://api.nlex.example.com

# Database
POSTGRES_USER=nlex
POSTGRES_PASSWORD=<strong-random-password>
POSTGRES_DB=nlex_db
DATABASE_URL=postgresql+asyncpg://nlex:<strong-random-password>@postgresql:5432/nlex_db

# Trino
TRINO_HOST=trino
TRINO_PORT=8080

# Auth
JWT_SECRET_KEY=<generate-with-openssl-rand-hex-32>
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Backend
CORS_ORIGINS=https://nlex.example.com
LOG_LEVEL=info
WORKERS=4

# LLM — Self-hosted (OpenAI-compatible API)
OPENAI_BASE_URL=http://llm-server.internal:8000/v1
OPENAI_API_KEY=not-needed
LLM_MODEL_SQL=meta-llama/Llama-3.1-70B-Instruct
LLM_MODEL_INFERENCE=meta-llama/Llama-3.1-70B-Instruct
MAX_SQL_RETRIES=3
```

!!!tip "Self-hosted LLM notes"
    - Set `OPENAI_BASE_URL` to your vLLM / Ollama / TGI endpoint (must expose an OpenAI-compatible API).
    - `OPENAI_API_KEY` can be set to any non-empty string if the server doesn't require authentication.
    - `LLM_MODEL_SQL` and `LLM_MODEL_INFERENCE` can use the same model, or different models if you want to optimize cost.
