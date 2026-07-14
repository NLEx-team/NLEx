# NLEx — Natural Language to SQL Platform

**NLEx** (Natural Language Explorer) is an enterprise-grade platform that translates natural language questions into SQL queries using Large Language Models. It leverages **Trino** as a federated SQL engine to seamlessly query across multiple heterogeneous database types — all from a single conversational interface.

> [!NOTE]
> NLEx supports any OpenAI-compatible LLM provider — GPT, DeepSeek, or your own locally hosted model.

---

## Overview

NLEx bridges the gap between business users and data infrastructure. Instead of writing complex SQL queries manually, users simply ask questions in plain English (or Russian), and the platform:

1. **Understands** the question using an LLM with RAG-enhanced schema context
2. **Generates** a validated, read-only SQL query
3. **Executes** the query across any connected database via Trino
4. **Returns** structured results in real-time through WebSocket

---

## High-Level Architecture

```mermaid
flowchart LR
    User([👤 User]) --> Frontend["Frontend\n(React 19 + Vite)"]
    Frontend -->|HTTP / WebSocket| Backend["Backend\n(FastAPI)"]
    Backend -->|SQL| Trino["Trino\n(Federated SQL Engine)"]
    Backend -->|HTTP| LLM["LLM API\n(OpenAI-compatible)"]

    Trino --> PG[(PostgreSQL)]
    Trino --> MySQL[(MySQL)]
    Trino --> Oracle[(Oracle)]
    Trino --> CH[(ClickHouse)]
    Trino --> Mongo[(MongoDB)]
    Trino --> MinIO[(MinIO / S3)]
```

---

## Key Features

| Feature | Description |
|---|---|
| 🗣️ **Natural Language to SQL** | Ask questions in plain language — get SQL queries and results instantly |
| 🔗 **Multi-Database Support** | Query PostgreSQL, MySQL, Oracle, ClickHouse, MongoDB, and MinIO through Trino |
| ⚡ **Real-Time Chat** | WebSocket-based conversational interface with streaming responses |
| 📊 **Excel Export** | Export query results to `.xlsx` with a single click |
| 🛡️ **Admin Panel & Analytics** | Manage users, databases, LLM configs; view usage analytics and query history |
| 🌍 **Internationalization (i18n)** | Full support for Russian and English interfaces |
| 🔐 **Role-Based Access Control** | Fine-grained permissions with admin and regular user roles |
| 🧠 **RAG Schema Filtering** | Intelligent table selection via cosine similarity to reduce token usage |
| ✅ **SQL Guard** | Read-only query enforcement at both prompt and validation levels |
| 🔌 **Dynamic Catalogs** | Add and manage database connections at runtime — no restarts required |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Ant Design, i18next |
| **Backend** | Python 3.11, FastAPI, SQLAlchemy, Pydantic |
| **Federated SQL** | Trino 481 |
| **Internal Database** | PostgreSQL 16 |
| **External Databases** | PostgreSQL, MySQL, Oracle, ClickHouse, MongoDB, MinIO |
| **LLM Integration** | OpenAI-compatible API (GPT, DeepSeek, custom) |
| **Infrastructure** | Docker, Docker Compose, nginx |
| **Auth** | JWT (access + refresh tokens) |
| **Real-Time** | WebSocket |

---

## Documentation

- 📐 [Architecture Overview](architecture/overview.md) — system design, component diagrams, request flow
- 🧩 [Services & Configuration](architecture/services.md) — per-service Dockerfile stages, env vars, health checks
- 🌐 [Network & Communication](architecture/network.md) — topology, ports, CORS, auth flow
- 🗄️ [Database Schema](architecture/database.md) — tables, relationships, migration strategy
- 🐳 [Docker Compose Deployment](deployment/docker-compose.md) — local & production Compose setup
- ☸️ [Per-Service (DevOps) Deployment](deployment/per-service.md) — Kubernetes manifests, scaling, shared storage
- 🔐 [Environment Variables](deployment/environment.md) — complete env var reference
- 🗺️ [Roadmap](roadmap.md) · 🤝 [Contributing](contributing.md) · 🧪 [Testing](testing.md)

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/NLEx-team/NLEx.git
cd NLEx

# Create your environment file and fill in secrets (ADMIN_PASSWORD, JWT_SECRET_KEY, ...)
cp .env.example .env.secret

# Start all services in dev mode (frontend + backend + PostgreSQL + Trino)
docker compose --env-file .env.secret --profile dev up --build

# Open the app
open http://localhost:5173
```

!!! info "Docs deployment"
    This documentation site is built with [MkDocs Material](https://squidfunk.github.io/mkdocs-material/) and published to **GitHub Pages** automatically by the `.github/workflows/docs.yml` workflow on every push to `develop`/`main` that changes `docs/**` or `mkdocs.yml`. To preview locally: `pip install mkdocs-material && mkdocs serve`.


---

<p align="center">
  <em>Built with ❤️ using FastAPI, React, Trino, and LLMs</em>
</p>
