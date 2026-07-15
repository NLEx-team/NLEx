# Service Configuration Guide

This document provides detailed per-service configuration for deploying the NLEx platform. Each section covers the technology stack, Dockerfile stages, environment variables, health checks, volumes, and operational notes.

---

## 1. Frontend Service

**Technology:** React 19.2 + TypeScript 6.0, Vite 8.0 (development), nginx:stable-alpine (production)

### Dockerfile (Multi-Stage)

| Stage         | Base Image          | Purpose                                              |
|---------------|---------------------|------------------------------------------------------|
| `base`        | `node:22-alpine`    | Install dependencies (`npm ci`)                      |
| `development` | From `base`         | Run Vite dev server on `:5173` with hot reload       |
| `production`  | `nginx:stable-alpine` | Copy `dist/` to `/usr/share/nginx/html`, serve static |

### Ports

| Environment | Port | Protocol |
|-------------|------|----------|
| Development | 5173 | HTTP     |
| Production  | 80   | HTTP     |

### Environment Variables

| Variable       | Default                  | Stage      | Description                          |
|----------------|--------------------------|------------|--------------------------------------|
| `VITE_API_URL` | `http://localhost:8000`  | Build-time | Backend API endpoint URL             |

!!! warning "Build-Time Variable"
    `VITE_API_URL` is embedded into the JavaScript bundle at **build time** by Vite. Changing it after the build has no effect. You must rebuild the frontend image whenever the backend URL changes.

### Volumes

| Environment | Volume Mapping          | Purpose            |
|-------------|-------------------------|--------------------|
| Development | `./frontend:/app`       | Hot reload support |
| Production  | None                    | Static files baked into image |

### Dependencies

- **Backend** must be reachable at the URL specified by `VITE_API_URL`.

!!! note "SPA Client-Side Routing"
    The production nginx container requires a rewrite rule to support client-side routing. All non-file requests must fall back to `index.html`. Example nginx configuration:

    ```nginx
    server {
        listen 80;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }
    }
    ```

### Health Check

No built-in health check. In production, nginx responds to HTTP requests on port 80. Use a simple HTTP probe:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:80/"]
  interval: 30s
  timeout: 5s
  retries: 3
```

---

## 2. Backend Service

**Technology:** Python 3.11, FastAPI, Uvicorn

### Dockerfile (Multi-Stage)

| Stage         | Base Image           | Purpose                                         |
|---------------|----------------------|-------------------------------------------------|
| `base`        | `python:3.11-slim`   | Install Python dependencies (`pip install`)      |
| `development` | From `base`          | Run Uvicorn with `--reload` for live reloading   |
| `production`  | From `base`          | Run Uvicorn **without** `--reload`               |

### Ports

| Environment | Port | Protocol |
|-------------|------|----------|
| All         | 8000 | HTTP     |

### Environment Variables

| Variable                | Default                          | Required | Description                                                  |
|-------------------------|----------------------------------|----------|--------------------------------------------------------------|
| `DATABASE_URL`          | `postgresql+asyncpg://nlex:nlex@postgres:5432/nlex` | Yes | PostgreSQL connection string (async driver)                  |
| `SYNC_DATABASE_URL`     | `postgresql+psycopg2://nlex:nlex@postgres:5432/nlex` | Yes | PostgreSQL connection string (sync driver, for migrations)   |
| `TRINO_HOST`            | `trino`                          | Yes      | Trino coordinator hostname                                   |
| `TRINO_PORT`            | `8080`                           | Yes      | Trino coordinator port                                       |
| `TRINO_USER`            | `nlex`                           | No       | Trino connection username                                    |
| `SECRET_KEY`            | *(none)*                         | Yes      | JWT signing secret — **must be set in production**           |
| `ADMIN_USERNAME`        | `admin`                          | No       | Default admin user created on first startup                  |
| `ADMIN_PASSWORD`        | `admin`                          | No       | Default admin password — **change immediately in production**|
| `ADMIN_EMAIL`           | `admin@nlex.local`               | No       | Default admin email address                                  |
| `OPENAI_API_KEY`        | *(none)*                         | No       | OpenAI API key for LLM-powered features                     |
| `LLM_MODEL`            | `gpt-4o`                         | No       | LLM model identifier                                        |
| `CORS_ORIGINS`          | `["http://localhost:5173"]`      | No       | Allowed CORS origins (JSON array)                            |
| `EXPORTS_DIR`           | `/app/exports`                   | No       | Directory for exported files                                 |
| `LOG_LEVEL`             | `info`                           | No       | Application log level (`debug`, `info`, `warning`, `error`)  |

!!! warning "Production Secrets"
    `SECRET_KEY` and `ADMIN_PASSWORD` **must** be changed from defaults before deploying to any non-local environment. Use Docker secrets or a vault solution to inject these values.

### Dependencies

- **PostgreSQL** — must be reachable at the host/port in `DATABASE_URL`. Backend will fail to start if the database is unavailable.
- **Trino** — must be reachable at `TRINO_HOST:TRINO_PORT`. Required for query execution against external data sources.

### Health Check

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/"]
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 15s
```

### Volumes

| Volume Name    | Mount Path      | Purpose                       |
|----------------|-----------------|-------------------------------|
| `exports_data` | `/app/exports`  | Persistent storage for exported query results |

### Startup Behavior

On startup, the backend automatically performs the following sequence:

1. **Create database tables** — SQLAlchemy models are synced to PostgreSQL.
2. **Run migrations** — Alembic migrations are applied (if any pending).
3. **Create admin user** — A default admin account is created using `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_EMAIL` (skipped if already exists).
4. **Sync Trino catalogs** — Reads catalog configurations from PostgreSQL and issues `CREATE CATALOG` statements to Trino to restore dynamic catalogs.

!!! tip "Startup Order"
    The backend should only start **after** PostgreSQL and Trino pass their health checks. Use `depends_on` with `condition: service_healthy` in Docker Compose.

---

## 3. PostgreSQL Service

**Image:** `postgres:16-alpine`

### Ports

| Port | Protocol | Description             |
|------|----------|-------------------------|
| 5432 | TCP      | PostgreSQL wire protocol |

### Environment Variables

| Variable            | Default | Required | Description                 |
|---------------------|---------|----------|-----------------------------|
| `POSTGRES_USER`     | *(none)* | Yes     | Database superuser name     |
| `POSTGRES_PASSWORD` | *(none)* | Yes     | Database superuser password |
| `POSTGRES_DB`       | *(none)* | Yes     | Default database to create  |

### Volumes

| Volume Name     | Mount Path                        | Purpose                         |
|-----------------|-----------------------------------|---------------------------------|
| `postgres_data` | `/var/lib/postgresql/data`        | Persistent database storage     |

### Health Check

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U $POSTGRES_USER -d $POSTGRES_DB"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 10s
```

!!! note "Internal Application Database Only"
    This PostgreSQL instance is the **internal application database** for NLEx metadata, user accounts, catalog configurations, and query history. It does **not** store customer/business data. Customer databases are connected externally through Trino catalogs.

---

## 4. Trino Service

**Image:** `trinodb/trino:481`

### Ports

| Port | Protocol | Description                  |
|------|----------|------------------------------|
| 8080 | HTTP    | Trino coordinator REST API & UI |

### Configuration

The Trino service requires a custom `config.properties` file mounted or baked into the image:

```properties
# trino-config.properties
coordinator=true
node-scheduler.include-coordinator=true
http-server.http.port=8080
catalog.management=dynamic
spill-enabled=true
spiller-spill-path=/tmp/trino-spill
```

| Property                | Value      | Description                                          |
|-------------------------|------------|------------------------------------------------------|
| `catalog.management`    | `dynamic`  | Enables `CREATE CATALOG` / `DROP CATALOG` SQL commands |
| `spill-enabled`         | `true`     | Allows spilling to disk for large queries            |

### Volumes

| Volume Name      | Mount Path             | Purpose                                  |
|------------------|------------------------|------------------------------------------|
| `trino_catalogs` | `/etc/trino/catalog`   | Catalog configuration files directory    |

### Health Check

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/v1/info"]
  interval: 15s
  timeout: 10s
  retries: 5
  start_period: 30s
```

!!! warning "Dynamic Catalogs Are Ephemeral"
    External database connections created via `CREATE CATALOG` are stored **in memory only** and are **lost on container restart**. The backend service automatically re-syncs all catalog configurations from PostgreSQL on startup, re-issuing `CREATE CATALOG` statements to restore connections.

!!! tip "Trino UI"
    The Trino web UI is available at `http://<host>:8080` and provides real-time query monitoring, worker status, and query history. Useful for debugging slow queries during development.

---

## Service Dependency Diagram

The following diagram shows the startup order and health check chain. Services start from bottom to top; each service waits for its dependencies to become healthy before starting.

```mermaid
graph TD
    subgraph Infrastructure
        PG["PostgreSQL :5432"]
        TR["Trino :8080"]
    end

    subgraph Application
        BE["Backend :8000"]
        FE["Frontend :80 / :5173"]
    end

    PG -- "pg_isready ✓" --> BE
    TR -- "curl /v1/info ✓" --> BE
    BE -- "curl / ✓" --> FE

    style PG fill:#336791,color:#fff,stroke:#264d73
    style TR fill:#dd00a1,color:#fff,stroke:#a8007a
    style BE fill:#2e7d32,color:#fff,stroke:#1b5e20
    style FE fill:#1565c0,color:#fff,stroke:#0d47a1
```

**Startup Order:**

1. **PostgreSQL** — starts first, no dependencies.
2. **Trino** — starts first, no dependencies (parallel with PostgreSQL).
3. **Backend** — waits for PostgreSQL (`pg_isready`) **and** Trino (`/v1/info`) to be healthy.
4. **Frontend** — waits for Backend (`curl /`) to be healthy (production). In development, can start independently since API URL is configured at build time.
