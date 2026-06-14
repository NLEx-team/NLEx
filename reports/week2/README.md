Here is the updated **`reports/week2/README.md`** with the new images (`MIT-permission.png` and PR examples) and the corrected transcript filename:

---

# Week 2 Report — NLEx

**Project:** NLEx — Natural Language to SQL
**Short Description:** A service that translates natural language requests into SQL queries, enabling business analysts to interact with databases without writing code.
**License:** [MIT](/LICENSE)

---

## Contents

- [User Stories](#user-stories)
- [Prototype & Interface Artifacts](#prototype--interface-artifacts)
- [MVP v0 Report & Deployment](#mvp-v0-report--deployment)
- [Pull Requests & Code Review](#pull-requests--code-review)
- [Branch Protection & CI/CD](#branch-protection--cicd)
- [Link Verification](#link-verification)
- [Coverage](#coverage)
- [Customer Communication](#customer-communication)
- [Weekly Analysis](#weekly-analysis)
- [LLM Usage Report](#llm-usage-report)

---

## User Stories

The full set of stable user stories with MoSCoW priorities and MVP version breakdown:

- [User Stories](user-stories.md)

---

## Prototype & Interface Artifacts

### Graphical Interface — Figma Prototype

The interactive Figma prototype covers the full MVP v1 user experience: authentication, database connection management, and the chat-to-SQL flow (prompt submission, clarification dialogue, draft preview, and Excel export).

🔗 **[NLEx — Figma Prototype](https://www.figma.com/design/ClCEafHql2b29oiC26gmpY/Untitled?m=auto&t=oLHybhELQCFfLaym-6)**

**Figma Screenshots:**

![Login](images/figma_artifacts/login.png)
![Create Profile](images/figma_artifacts/createProfile.png)
![Edit Profile](images/figma_artifacts/editProfile.png)
![Input CDB](images/figma_artifacts/inputCDB.png)
![Sidebar](images/figma_artifacts/Sidebar.png)
![Create New Session](images/figma_artifacts/createNewSession.png)
![Chat Example V1](images/figma_artifacts/chatExampleV1.png)
![Buttons](images/figma_artifacts/buttons.png)
![Toggle](images/figma_artifacts/toggle.png)

### API Interface — Swagger UI, OpenAPI & Postman Collection

The backend API is documented via Swagger UI (27 endpoints across `auth`, `users`, `chats`, and `connections` resources).

| Artifact | Link / File |
|---|---|
| **Swagger UI** | [http://194.226.97.77:8000/docs](http://194.226.97.77:8000/docs) |
| **OpenAPI Specification (YAML)** | [openapi.yaml](openapi.yaml) |
| **Postman Collection** | [postman_collection.json](postman_collection.json) |

![Swagger UI](images/runnable-artifact.png)

---

## MVP v0 Report & Deployment

The MVP v0 technical foundation is deployed and smoke-testable. It demonstrates end-to-end connectivity between the React frontend and FastAPI backend, with all 27 API endpoints documented and mock-ready.

- [MVP v0 Report](mvp-v0-report.md)

### Deployed Artifacts

| Resource | URL |
|---|---|
| **Frontend** | [https://nlex.vercel.app/](https://nlex.vercel.app/) |
| **Backend API (Swagger)** | [http://194.226.97.77:8000/docs](http://194.226.97.77:8000/docs) |
| **Backend API (Base)** | [http://194.226.97.77:8000](http://194.226.97.77:8000) |

### Public Video Demonstration

🔗 **[MVP v0 Demo Video](https://drive.google.com/file/d/1tTa6MDl0N_5i25dURntALOUFs9w6NxTL/view?usp=sharing)**

![MVP v0 Deployment](images/runnable-artifact.png)

### Local Run Instructions

Full Docker-based setup instructions are available in the root [README.md](/README.md). Quick start:

```bash
cp .env.example .env.secret
docker compose --env-file .env.secret --profile dev up --build
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Swagger Docs: `http://localhost:8000/docs`

---

## Pull Requests & Code Review

All Week 2 pull requests were peer-reviewed by another team member. The following PRs were created and reviewed:

| PR | Link |
|---|---|
| #6 | [https://github.com/NLEx-team/NLEx/pull/6](https://github.com/NLEx-team/NLEx/pull/6) |
| #7 | [https://github.com/NLEx-team/NLEx/pull/7](https://github.com/NLEx-team/NLEx/pull/7) |
| #8 | [https://github.com/NLEx-team/NLEx/pull/8](https://github.com/NLEx-team/NLEx/pull/8) |
| #9 | [https://github.com/NLEx-team/NLEx/pull/9](https://github.com/NLEx-team/NLEx/pull/9) |
| #10 | [https://github.com/NLEx-team/NLEx/pull/10](https://github.com/NLEx-team/NLEx/pull/10) |
| #11 | [https://github.com/NLEx-team/NLEx/pull/11](https://github.com/NLEx-team/NLEx/pull/11) |

### PR Template

The project uses a standard pull request template:

- [PR Template](PR_template.md)

**Reviewed PR Examples:**

![Reviewed PR — 1](images/PR-example/image_2026-06-14_20-06-30.png)
![Reviewed PR — 2](images/PR-example/image_2026-06-14_20-06-30(1).png)

---

## Branch Protection & CI/CD

### Protected Default Branch

The `develop` branch is the protected default branch. The latest successful state:

🔗 **[develop branch](https://github.com/NLEx-team/NLEx/tree/develop)**

**Branch Protection Settings:**

![Master Branch Rule — 1](images/master-branch-rule/image_2026-06-14_19-30-26(1).png)
![Master Branch Rule — 2](images/master-branch-rule/image_2026-06-14_19-30-26(2).png)
![Master Branch Rule — 3](images/master-branch-rule/image_2026-06-14_19-30-26.png)

### Lychee Link Checker

Lychee is not currently configured in this project. All external links in this report and related documentation have been manually verified by opening each link in a browser before submission.

---

## Link Verification

All links in this report and accompanying documents were manually verified:

| Link | Type | Verified |
|---|---|---|
| Figma Prototype | External | ✅ |
| Swagger UI (`194.226.97.77:8000/docs`) | External | ✅ |
| Frontend (`nlex.vercel.app`) | External | ✅ |
| Demo Video (Google Drive) | External | ✅ |
| GitHub PRs (#6–#11) | External | ✅ |
| `develop` branch | External | ✅ |
| All internal `.md` file links | Relative | ✅ |
| `openapi.yaml` | Relative | ✅ |
| `postman_collection.json` | Relative | ✅ |

No links were excluded — all are accessible and verified.

---

## Coverage

### Prototype Coverage

The Figma prototype visually addresses the following stable user-story IDs:

| Story | Description | Covered in Prototype |
|---|---|---|
| US-01 | Natural language query input | ✅ Chat input field and prompt flow |
| US-02 | Single database selector | ✅ Database dropdown in chat setup |
| US-03 | Excel file download | ✅ Save & download button in Reply Preview |
| US-04 | Result preview in browser | ✅ Reply Preview with first rows |
| US-05 | Clarification dialogue | ✅ Clarifying question flow |
| US-06 | Config-file DB connection | Not in prototype (backend concern) |
| US-07 | Startup health-check | ✅ "Test Connection" button in Add Database screen |
| US-08 | View generated SQL | ✅ SQL preview area (collapsible) |
| US-09 | Query history | Not in current prototype |
| US-10 | Excel auto-formatting | Implied by Excel export flow |

### MVP v0 Coverage

MVP v0 provides the technical foundation for the following stable user-story IDs by establishing the deployment infrastructure, API surface, and connectivity between frontend and backend:

| Story | Description | MVP v0 Contribution |
|---|---|---|
| US-01 | Natural language query input | Backend endpoint `POST /chats/{chat_id}/prompt` defined; frontend auth page live |
| US-02 | Single database selector | Endpoints for `connections` resource defined and documented in Swagger |
| US-06 | Config-file DB connection | Docker-based deployment with env-file configuration is operational |

For full details on MVP v0 capabilities and the repeatable smoke-check scenario, see [mvp-v0-report.md](mvp-v0-report.md).

---

## Customer Communication

### Meeting Transcript

The full transcript of the Week 2 customer meeting (Russian original and English translation, with speaker attributions and timecodes):

- [Customer Meeting Transcript](customer-meeting-transcript.md)

### Customer Meeting Notes

Key decisions and action items captured during the meeting:

- [Customer Meeting Notes](customer-meeting-notes.md)

### Meeting Summary

A structured summary of the meeting with key decisions, action items, and notes:

- [Customer Meeting Summary](customer-meeting-summary.md)

### Customer Permission

The meeting was recorded with the customer's permission. The customer agreed to:
- Recording and private sharing of the sanitized transcript with course instructors for assessment.
- Publication of the sanitized English transcript in the public repository.

**Evidence of written consent to the MIT-licensed public development model:**

![MIT Permission](images/MIT-permission.png)

---

## Weekly Analysis

The Sprint 1 / Week 2 analysis covering learning points, validated assumptions, items needing clarification, and planned responses:

- [Weekly Analysis](analysis.md)

---

## LLM Usage Report

A detailed report on how AI/LLM tools were used throughout Week 2 for transcription, translation, proofreading, and formatting:

- [LLM Usage Report](llm-report.md)

---

## Report Index

| Document | File |
|---|---|
| **This Index** | `reports/week2/README.md` |
| User Stories | [user-stories.md](user-stories.md) |
| MVP v0 Report | [mvp-v0-report.md](mvp-v0-report.md) |
| LLM Usage Report | [llm-report.md](llm-report.md) |
| Customer Transcript | [customer-meeting-transcript.md](customer-meeting-transcript.md) |
| Customer Meeting Notes | [customer-meeting-notes.md](customer-meeting-notes.md) |
| Customer Meeting Summary | [customer-meeting-summary.md](customer-meeting-summary.md) |
| Weekly Analysis | [analysis.md](analysis.md) |
| PR Template | [PR_template.md](PR_template.md) |
| OpenAPI Specification | [openapi.yaml](openapi.yaml) |
| Postman Collection | [postman_collection.json](postman_collection.json) |
| Local Setup (Root) | [/README.md](/README.md) |

---

**Screenshots** are located in `reports/week2/images/`:

| Screenshot | File |
|---|---|
| Login | `images/figma_artifacts/login.png` |
| Create Profile | `images/figma_artifacts/createProfile.png` |
| Edit Profile | `images/figma_artifacts/editProfile.png` |
| Input CDB | `images/figma_artifacts/inputCDB.png` |
| Sidebar | `images/figma_artifacts/Sidebar.png` |
| Create New Session | `images/figma_artifacts/createNewSession.png` |
| Chat Example V1 | `images/figma_artifacts/chatExampleV1.png` |
| Buttons | `images/figma_artifacts/buttons.png` |
| Toggle | `images/figma_artifacts/toggle.png` |
| Branch Protection — 1 | `images/master-branch-rule/image_2026-06-14_19-30-26(1).png` |
| Branch Protection — 2 | `images/master-branch-rule/image_2026-06-14_19-30-26(2).png` |
| Branch Protection — 3 | `images/master-branch-rule/image_2026-06-14_19-30-26.png` |
| Reviewed PR — 1 | `images/PR-example/image_2026-06-14_20-06-30.png` |
| Reviewed PR — 2 | `images/PR-example/image_2026-06-14_20-06-30(1).png` |
| MIT Permission | `images/MIT-permission.png` |
| Runnable Artifact (Swagger) | `images/runnable-artifact.png` |
