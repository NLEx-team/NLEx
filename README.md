# NLEx

**NLEx — Natural Language to SQL.** A service that translates natural language requests into SQL queries, enabling business analysts to interact with databases without writing code.

## Documentation & Reports

- **License:** [MIT](LICENSE)
- **Deployed Product:** [https://nlex.tech/](https://nlex.tech/)
- **Docs site (GitHub Pages):** [https://NLEx-team.github.io/NLEx/](https://NLEx-team.github.io/NLEx/)
- **Customer Handover:** [docs/customer-handover.md](docs/customer-handover.md)
- **Contributing guide:** [CONTRIBUTING.md](CONTRIBUTING.md)
- **Agent guidance:** [AGENTS.md](AGENTS.md)
- **Week 7 report (index):** [reports/week7/README.md](reports/week7/README.md)
- **Week 6 report (index):** [reports/week6/README.md](reports/week6/README.md)
- **Week 5 report (index):** [reports/week5/README.md](reports/week5/README.md)
- **Week 4 report (index):** [reports/week4/README.md](reports/week4/README.md)
- **Week 3 report (index):** [reports/week3/README.md](reports/week3/README.md)
- **Week 2 report (index):** [reports/week2/README.md](reports/week2/README.md)
- **Changelog:** [CHANGELOG.md](CHANGELOG.md)
- **Roadmap:** [docs/roadmap.md](docs/roadmap.md)
- **Testing:** [docs/testing.md](docs/testing.md)
- **User Acceptance Tests:** [docs/user-acceptance-tests.md](docs/user-acceptance-tests.md)
## Team & Roles

NLEx was designed and developed by a dedicated team of students at Innopolis University:

- **Maksim Merkushev** — Product Owner & Network/Deployment Engineer
- **Serafim Soldatov** — Scrum Master & Lead Business Analyst
- **Maksim Maltsev** — Frontend Developer & System Architect
- **Polina Systerova** — QA Engineer & Frontend Developer
- **Ramina Ianturina** — UI/UX Designer & Frontend Developer
- **Liubov Savchenko** — DevOps & Backend Developer

For a detailed description of each team member's contributions, see [TEAM.md](TEAM.md).

## How to Run with Docker

### 1. Environment Configuration
Create your secret environment file from the example:
```bash
cp .env.example .env.secret
```
Adjust the values in `.env.secret` (e.g., `FRONTEND_PORT`, `BACKEND_PORT`) as needed.

### 2. Running the Project

The project uses Docker Profiles to manage different environments.

#### Development Mode
Includes hot-reload for both frontend and backend.
```bash
docker compose --env-file .env.secret --profile dev up --build
```
- **Frontend:** [http://localhost:5173](http://localhost:5173) (or your configured `FRONTEND_PORT`)
- **Backend API:** [http://localhost:8000](http://localhost:8000) (or your configured `BACKEND_PORT`)

#### Production Mode
Optimized builds served via Nginx (frontend) and Uvicorn (backend).
```bash
docker compose --env-file .env.secret --profile prod up --build
```
- **Frontend:** [http://localhost:80](http://localhost:80)
- **Backend API:** [http://localhost:8000](http://localhost:8000)

#### Testing
Runs the backend test suite in an isolated environment.
```bash
docker compose --env-file .env.secret --profile test up backend-test --build --abort-on-container-exit
```
This command automatically starts the database, runs the tests, and shuts everything down when finished.

### 3. Stopping the Services
```bash
docker compose --profile dev down  # for development
# OR
docker compose --profile prod down # for production
```
