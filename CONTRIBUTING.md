# NLEx Developer Guide

Read this file once before writing your first line of code. It outlines all the rules for working with Git and GitHub in our project, as well as testing and code standards.

## 🌳 Branches

The project has 2 protected branches and many personal working branches.

| Branch | Purpose | Who can push? |
| --- | --- | --- |
| main | Finished product (releases) | No one directly. Only via PR with an Approve |
| develop | Shared working draft | No one directly. Only via PR with an Approve |
| feature/... | Your personal branch for the task | You, freely |

## 📛 How to name your branches?

Format: `feature/<team>/<short-task-description>`

**Examples:**

* Frontend
* `feature/frontend/chat-ui`
* `feature/frontend/excel-download-button`
* `feature/frontend/database-selector`

* Backend
* `feature/backend/postgres-connector`
* `feature/backend/excel-export`
* `feature/backend/api-routes`

* AI / LLM
* `feature/ai/system-prompt`
* `feature/ai/text-to-sql-chain`
* `feature/ai/clarification-logic`

* Bugfixes (for everyone)
* `fix/backend/timeout-error`
* `fix/frontend/button-not-clickable`
* `fix/ai/wrong-sql-dialect`

**Rules:**

* Only Latin characters, lowercase letters, words separated by hyphens (-).
* No spaces, Cyrillic characters, or special characters.
* The name must be short and clear (2-4 words).

## 🔄 Daily Workflow (Step-by-Step)

**1. Starting work — update develop**
Before writing code, always pull the latest version of the shared draft:

```bash
git checkout develop
git pull origin develop
```

**2. Create your branch**

```bash
git checkout -b feature/backend/excel-export
```

Now you are in your personal "room". Write code, break things, test — no one but you will see it.

**3. Save your progress (Commits)**
Commit frequently (every 1-2 hours of work) rather than making one giant commit at the end of the day.

```bash
git add .
git commit -m "feat: added Excel generation from DataFrame"
```

**4. Push your branch to GitHub**

```bash
# First time (creating the branch on the server):
git push -u origin feature/backend/excel-export

# All subsequent times:
git push
```

**5. Open a Pull Request (When the task is ready)**

* Go to our repository on the GitHub website.
* GitHub will automatically show a yellow banner: "feature/backend/excel-export had recent pushes" and a "Compare & pull request" button. Click it.
* In the PR title, briefly describe what you did.
* In the Description, write the details: what changed, what you tested, and if there are any bugs.
* Make sure the PR is targeted at the `develop` branch (not `main`!).
* Every PR must reference the related GitHub Issue.
* Drop the PR link into the team's general chat.

**6. Wait for Approve**
One of the two moderators (Owners) will review your code and click Approve. After that, the code will automatically merge into develop. Your `feature/...` branch will be automatically deleted.

## ✍️ How to write commits? (Conventional Commits)

We use the Conventional Commits standard. Every commit message starts with the type of change.
Format: `type: short description`

| Type | When to use | Example |
| --- | --- | --- |
| feat: | New functionality | feat: added chat interface |
| fix: | Bug fix | fix: fixed SQL query timeout |
| docs: | Documentation | docs: updated API contracts |
| refactor: | Rewrote code without changing behavior | refactor: simplified DB connector |
| chore: | Project setup, dependencies | chore: added Docker Compose |
| style: | Formatting (spaces, indents) | style: fixed indentation in prompts.py |
| test: | Adding/changing tests | test: added tests for excel_exporter |

Write commits in Russian or English, but keep them short and to the point.

✅ Good:

* `feat: added Excel download button`
* `fix: fixed PostgreSQL connection error`

❌ Bad:

* `fix`
* `update`
* `uhhh it works`

## ⚠️ What you MUST NOT do

* Do not push directly to `main` or `develop` — GitHub will block it.
* Do not name branches using Cyrillic characters: `feature/кнопка` ❌
* Do not commit files with passwords, API keys, or tokens. Store them in a `.env` file (it is already added to `.gitignore`).
* Do not commit `node_modules/`, `__pycache__/`, or `venv/` folders — they are already in `.gitignore`.

## 🆘 Common Problems and Solutions

**"I have a conflict on pull!"**

```bash
git stash                 # Temporarily hide your changes
git pull origin develop  # Pull the fresh code
git stash pop            # Bring your changes back
# If there are conflicts, open the file, find the lines with <<<< and >>>>, and choose the correct version
```

**"I accidentally started writing code in develop!"**

```bash
git stash                               # Hide changes
git checkout -b feature/ai/my-task      # Create the correct branch
git stash pop                           # Bring changes back into the new branch
```

**"I need the latest code from develop in my branch"**

```bash
git checkout feature/backend/my-task  # Make sure you are in your branch
git merge develop                     # Merge the fresh develop into it
```

## 🏗️ Code Quality & Standards
- **Python (Backend)**: Follow PEP 8 guidelines. Use type hints for function arguments and return types. Include docstrings for public APIs.
- **TypeScript/React (Frontend)**: Follow the ESLint configuration. Use functional components with hooks and ensure strict mode is enabled.
- **Dependencies**: Do not introduce new dependencies without team discussion.

## 🧪 Testing Requirements
- Write or update tests for any new code or bug fixes.
- Code coverage must not drop below the 30% threshold for critical modules.
- **Backend Tests**: Run `cd backend && pytest tests/ -v`
- **Frontend Build Validation**: Run `cd frontend && npm run build`
- **Docker Compose**: Verify container builds locally via `docker compose --profile dev build`

## 📚 Maintained Documentation
When making changes, ensure relevant documentation is updated. See `AGENTS.md` for a full list of maintained documents and when to update them. In particular, any user-visible change must be recorded in `CHANGELOG.md` following the [Keep a Changelog](https://keepachangelog.com/) format.
