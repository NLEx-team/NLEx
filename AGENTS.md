# AGENTS.md — AI and LLM Contributor Guidance

## Overview

This document provides guidance for AI agents, LLMs, and automated tools that contribute to the NLEx (Natural Language Explorer) codebase. It defines the constraints, expectations, and safety rules that must be followed.

## Project Context

NLEx is a web-based platform that enables non-technical users to query structured databases using natural language. The system translates natural language into SQL via LLMs and executes queries across multiple database types through Trino.

**Tech Stack:**
- Frontend: React + TypeScript + Vite
- Backend: Python + FastAPI
- Query Engine: Trino
- Database: PostgreSQL (application data)
- Deployment: Docker Compose (dev/prod/test profiles)
- Documentation: MkDocs Material (hosted on GitHub Pages)

## Repository Structure

```
NLEx/
├── backend/          # Python/FastAPI backend
├── frontend/         # React/TypeScript frontend
├── docs/             # MkDocs documentation source
├── reports/          # Weekly Sprint reports
├── .github/          # CI workflows, PR template
├── docker-compose.yml
├── mkdocs.yml
├── README.md
├── CONTRIBUTING.md
├── CHANGELOG.md
└── AGENTS.md
```

## Contribution Rules

### Workflow
1. All changes must be made through **issue-linked branches** and **Pull Requests**
2. Branch naming: `feature/<category>/<description>`, `fix/<category>/<description>`, `docs/<description>`
3. Every PR must reference the related GitHub Issue
4. At least **one human review** is required before merge
5. All CI checks must pass before merge
6. PRs are merged into `develop` first, then `develop` is merged into `main` for releases

### Code Quality
1. Follow existing code style and conventions:
   - **Python**: PEP 8, type hints, docstrings for public APIs
   - **TypeScript/React**: ESLint config, functional components with hooks, strict mode
2. Do not introduce new dependencies without team discussion
3. Write or update tests for any code changes
4. Do not decrease test coverage below the 30% threshold for critical modules

### Safety Constraints
1. **Never commit secrets, credentials, API keys, or `.env`/`.env.secret` files** to the repository
2. **Never expose database credentials** in frontend code, logs, or API responses
3. **Never share customer data or production database content** with external services
4. **Never modify CI/CD pipeline configurations** without explicit team approval
5. **Never force-push to the `main` or `develop` branches** or bypass branch protection rules
6. **Never delete or modify production deployment configurations** without team review

### Documentation
1. Update relevant documentation when behavior changes
2. Keep `CHANGELOG.md` current for user-visible changes
3. Follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format
4. Use clear, concise English in all documentation
5. Do not generate filler text or generic content

### Testing
1. Run backend tests: `cd backend && pytest tests/ -v`
2. Run frontend build verification: `cd frontend && npm run build`
3. Verify Docker Compose builds: `docker compose --profile dev build`
4. Check documentation builds: `mkdocs build`

## Verification Commands

```bash
# Backend tests
cd backend && pytest tests/ -v

# Frontend build
cd frontend && npm run build

# Lint backend
cd backend && flake8 app/

# Lint frontend
cd frontend && npm run lint

# Build documentation
mkdocs build

# Full stack local deployment (development)
docker compose --env-file .env.secret --profile dev up --build

# Run test suite
docker compose --env-file .env.secret --profile test up backend-test --build --abort-on-container-exit
```

## Review Expectations

- AI-generated code must be **clearly understandable** by the human reviewer
- AI-generated PRs should include a clear description of what changed and why
- Do not submit PRs with generic or boilerplate descriptions
- If an AI tool is used to generate code or documentation, disclose this in the PR description

## Maintained Documentation

The following documents must be kept current when relevant changes are made:

| Document | Update When |
|----------|------------|
| `README.md` | Setup, usage, or access instructions change |
| `CONTRIBUTING.md` | Workflow, review process, or standards change |
| `AGENTS.md` | Safety constraints, verification commands, or repo structure change |
| `CHANGELOG.md` | Any user-visible change is merged |
| `docs/customer-handover.md` | Deployment, configuration, or transition status change |
| `docs/roadmap.md` | Version milestones or planned scope change |
| `docs/architecture/` | System components or design decisions change |
