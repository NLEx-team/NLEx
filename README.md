# NLEx

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

### 3. Stopping the Services
```bash
docker compose --profile dev down  # for development
# OR
docker compose --profile prod down # for production
```
