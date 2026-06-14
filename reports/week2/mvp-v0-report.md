# MVP v0 Report

## 1. Purpose and Description

The goal of MVP v0 is to establish a **runnable, deployed technical foundation** for the NLEx project. It does not aim to implement complete user stories or replicate the full Figma prototype. Instead, it serves as proof that the core infrastructure — frontend, backend API, and deployment pipeline — is functional and ready to support iterative feature development in subsequent sprints.

### What MVP v0 includes:

| Layer | Status | Details |
|---|---|---|
| **Frontend** | Deployed | React application with authentication page (login/register) connected to the live backend. |
| **Backend API** | Deployed | FastAPI application with full Swagger documentation. Endpoints for `auth`, `users`, `chats`, and `connections` are exposed. |
| **Authentication** | Connectivity-only | The frontend can successfully reach the backend through the auth endpoints, demonstrating end-to-end connectivity. However, no real user database exists yet — the auth flow validates the network path, not actual credentials. |
| **Other API endpoints** | Mocked | `users`, `chats`, and `connections` endpoints return placeholder responses. Business logic exists separately but is not yet wired to the API. |
| **LLM & Cross-DB Logic** | Implemented (offline) | The LLM service, cross-database query layer (Trino), and schema service are fully implemented in business logic but intentionally decoupled from the API for MVP v0. |
| **Database** | Not yet integrated | No persistent user database exists at this stage. Authentication is used solely to verify frontend-backend connectivity. |

---

## 2. Deployment URLs

| Resource | URL |
|---|---|
| **Frontend** | [https://nlex.vercel.app/](https://nlex.vercel.app/) |
| **Backend API (Swagger UI)** | [http://194.226.97.77:8000/docs](http://194.226.97.77:8000/docs) |
| **Backend API (Base URL)** | [http://194.226.97.77:8000](http://194.226.97.77:8000) |

---

## 3. Public Video Demonstration

A short demonstration video is available at the following link:

**[MVP v0 Demo Video](https://drive.google.com/file/d/1tTa6MDl0N_5i25dURntALOUFs9w6NxTL/view?usp=sharing)**

**Content:**
- The team navigates to the deployed frontend at `nlex.vercel.app`.
- The authentication page (login/register) is shown, confirming the frontend is live and reachable.
- A request is made from the frontend to the backend, demonstrating that the two layers can communicate successfully over the network.
- The team opens the Swagger UI at `194.226.97.77:8000/docs` and demonstrates the available API endpoints and data schemas.
- This serves as evidence of a **deployed, reachable product foundation** rather than a full functional presentation.

---

## 4. Relationship to Prototype and MVP v1 Stories

### Prototype (Figma)

The Figma prototype (reviewed with the customer during the Week 2 meeting) represents the **target user experience for MVP v1**. It includes polished screens for:
- Authentication (login/signup)
- Profile editing
- Database connection management (with alias naming and connection testing)
- Chat interface with LLM interaction (prompt submission, draft preview, SQL preview, Excel export)

The prototype is accessible via the following link:
https://www.figma.com/design/ClCEafHql2b29oiC26gmpY/Untitled

### MVP v0 vs. Prototype

MVP v0 is deliberately minimal. It demonstrates that the frontend can communicate with the backend — a prerequisite for all future feature work — but does not yet implement the chat or database management UI beyond static placeholders. This aligns with the project guidance:

> *"MVP v0 is a runnable or deployed technical product foundation with a working smoke check. It does not need to implement a complete user story or reproduce the prototype."*

### Mapping to MVP v1 user stories

Stable user-story IDs are defined in [`user-stories.md`](user-stories.md). MVP v0 establishes infrastructure that will eventually serve the following stories:

| Story | Title | Relation to MVP v0 |
|---|---|---|
| **US-01** | Natural language query input | Backend endpoint `POST /chats/{chat_id}/prompt` is defined in OpenAPI and reachable through Swagger; the prompt-to-SQL pipeline is implemented offline and will be wired in MVP v1. |
| **US-02** | Single database selector | `connections` resource is defined in OpenAPI and reachable through Swagger; UI dropdown and persistence are deferred to MVP v1. |
| **US-04** | Result preview in browser | Backend response schema for `/chats/{chat_id}/prompt` includes the preview payload; frontend rendering is deferred to MVP v1. |
| **US-05** | Clarification dialogue | Backend response schema models the clarification turn; frontend conversation UI is deferred to MVP v1. |
| **US-06** | Config-file-based DB connection | Docker-based deployment with `.env`-driven configuration is operational. Connection parameters are read on startup. |
| **US-07** | Startup health-check | `GET /` health endpoint is reachable through Swagger; the deeper config-driven check is planned for MVP v1. |
| **US-08** | View generated SQL | Backend response schema includes the generated SQL field; UI rendering is deferred to MVP v1. |

MVP v0 deliberately does **not** implement any of the above stories end-to-end. It provides the deployment, API surface, and connectivity that those stories will reuse.

---

## 5. Current Limitations, Placeholders, and Mocks

### Limitations

- **Authentication:** The auth flow is functional only as a **connectivity test** — it proves the frontend can reach the backend over the network. There is no persistent user database, so credentials are not actually stored or validated against real user records.
- **API Endpoints (Users, Chats, Connections):** All non-authentication endpoints currently return mock responses. The full API surface is defined and documented in Swagger, but backend logic is not yet wired.
- **LLM Integration:** The LLM service is fully implemented in business logic (makes real calls to AI models) but is intentionally not connected to any API endpoints or the frontend. This was a deliberate scope decision for MVP v0.
- **Cross-Database Query Layer (Trino):** Implemented but not yet exposed through the API. Integration with the connections and chats workflows is planned for MVP v1.
- **Frontend:** Only the authentication page makes real backend calls. The remaining screens (profile, database management, chat interface) are static and do not interact with live data.
- **No Excel Export:** The preview-to-Excel flow demonstrated in the Figma prototype is not yet implemented.
- **No Admin Panel:** Role separation and admin functionality are deferred to MVP v2.

### Placeholders & Mocks

- `GET /users`, `GET /users/{id}`, `PATCH /users/{id}`, `DELETE /users/{id}` — return static/mock data.
- `POST /chats`, `GET /chats/{chat_id}`, and all chat sub-resources — return mock responses.
- `GET /connections`, `POST /connections`, and connection management endpoints — return mock responses.
- Frontend pages beyond login/register display static content from the prototype design.

---

## 6. Local Setup Instructions

Full Docker-based instructions for local deployment are documented in the **root** [`README.md`](../../README.md) of the repository. The Week 2 report index is at [`reports/week2/README.md`](README.md).

### Quick Start Summary

1. **Clone the repository.**
2. **Configure environment:**
   ```bash
   cp .env.example .env.secret
   ```
3. **Run in development mode:**
   ```bash
   docker compose --env-file .env.secret --profile dev up --build
   ```
4. **Access:**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:8000`
   - Swagger Docs: `http://localhost:8000/docs`

The root README also covers production mode, the testing profile, and stopping services.

---

## 7. Repeatable Smoke-Check Scenario

The following scenario verifies that the deployed MVP v0 foundation is operational:

### Scenario: Connectivity Smoke Check

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to [https://nlex.vercel.app/](https://nlex.vercel.app/) | The NLEx authentication page loads successfully. |
| 2 | Enter any email and password in the registration form. Submit. | The frontend sends a request to the backend. A notification appears in the bottom part of the screen, confirming the frontend successfully reached the backend API. |
| 3 | Enter any email and password in the login form. Submit. | A notification appears, confirming connectivity. (Note: at this stage, credentials are not validated against a real user database.) |
| 4 | Disconnect from the internet and repeat step 2 or 3. | An error notification appears, confirming that the notification behavior correctly distinguishes between successful connectivity and network failure. |
| 5 | Navigate to [http://194.226.97.77:8000/docs](http://194.226.97.77:8000/docs) | The Swagger UI loads, showing all available API endpoints and schemas. |
| 6 | In Swagger, execute `GET /` | Returns a 200 OK response, confirming the API is reachable. |
| 7 | In Swagger, execute `POST /auth/register` with test credentials | Returns a response from the backend, confirming the auth endpoint is reachable. |
| 8 | In Swagger, execute `POST /auth/login` with test credentials | Returns a response from the backend, confirming the auth endpoint is reachable. |

**Failure conditions:**
- If the frontend cannot reach the backend, an error notification indicates a connectivity issue.
- If Swagger is unreachable, the backend server may be down.
- No internet connection: the frontend displays an error notification instead of a success notification.

---

## 8. Summary

MVP v0 successfully delivers a **deployed, smoke-testable technical foundation**. The key achievement is demonstrating end-to-end connectivity: the frontend at `nlex.vercel.app` can successfully reach the backend API at `194.226.97.77:8000`. The authentication flow serves as a network connectivity proof — it is not backed by a real user database at this stage. All remaining API endpoints are defined and documented, with business logic (LLM, Trino, schema service) implemented and awaiting integration.

The team is on track to begin wiring these components together in Sprint 2, targeting an MVP v1 demo by the end of Week 3 or mid-Week 4, as agreed with the customer.
