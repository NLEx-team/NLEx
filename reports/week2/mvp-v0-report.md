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
| **LLM & Cross-DB Logic** | Implemented (offline) | The LLM service, cross-database query layer (Trina), and schema service are fully implemented in business logic but intentionally decoupled from the API for MVP v0. |
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

### Mapping to MVP v1 User Stories

| MVP v1 Story | Relation to MVP v0 |
|---|---|
| **US-1 (Authentication)** | Partially present. The auth endpoints exist and the frontend can reach them, confirming network connectivity. Real user registration and login logic will be implemented in MVP v1. |
| **US-2 (Profile Management)** | API endpoints exist (mocked). Will be connected in MVP v1. |
| **US-3 (Database Connection)** | API endpoints exist (mocked). Business logic (Trina integration) is ready but not wired. |
| **US-4 (Chat Creation)** | API endpoints exist (mocked). Frontend UI exists as static prototype page. |
| **US-5 (Prompt Submission)** | Not yet connected. LLM service is implemented separately and will be integrated in MVP v1. |
| **US-7 (Test Connection)** | Confirmed as Must Have during customer review. Endpoint `/connections/{id}/check` is in the API spec. |

---

## 5. Current Limitations, Placeholders, and Mocks

### Limitations

- **Authentication:** The auth flow is functional only as a **connectivity test** — it proves the frontend can reach the backend over the network. There is no persistent user database, so credentials are not actually stored or validated against real user records.
- **API Endpoints (Users, Chats, Connections):** All non-authentication endpoints currently return mock responses. The full API surface is defined and documented in Swagger, but backend logic is not yet wired.
- **LLM Integration:** The LLM service is fully implemented in business logic (makes real calls to AI models) but is intentionally not connected to any API endpoints or the frontend. This was a deliberate scope decision for MVP v0.
- **Cross-Database Query Layer (Trina):** Implemented but not yet exposed through the API. Integration with the connections and chats workflows is planned for MVP v1.
- **Frontend:** Only the authentication page makes real backend calls. The remaining screens (profile, database management, chat interface) are static and do not interact with live data.
- **No Excel Export:** The preview-to-Excel flow demonstrated in the Figma prototype is not yet implemented.
- **No Admin Panel:** Role separation and admin functionality are deferred to MVP v2.0.

### Placeholders & Mocks

- `GET /users`, `GET /users/{id}`, `PATCH /users/{id}`, `DELETE /users/{id}` — return static/mock data.
- `POST /chats`, `GET /chats/{chat_id}`, and all chat sub-resources — return mock responses.
- `GET /connections`, `POST /connections`, and connection management endpoints — return mock responses.
- Frontend pages beyond login/register display static content from the prototype design.

---

## 6. Local Setup Instructions

Full instructions for local deployment via Docker are available in the **README.md** file located in the same directory as this report (`reports/week2/README.md`).

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

The README also covers production mode, testing profile, and stopping services.

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

MVP v0 successfully delivers a **deployed, smoke-testable technical foundation**. The key achievement is demonstrating end-to-end connectivity: the frontend at `nlex.vercel.app` can successfully reach the backend API at `194.226.97.77:8000`. The authentication flow serves as a network connectivity proof — it is not backed by a real user database at this stage. All remaining API endpoints are defined and documented, with business logic (LLM, Trina, schema service) implemented and awaiting integration.

The team is on track to begin wiring these components together in Sprint 2, targeting an MVP v1.0 demo by the end of Week 3 or mid-Week 4, as agreed with the customer.


