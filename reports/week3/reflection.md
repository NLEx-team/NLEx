# Reflection — Week 3

## Learning points
- **Vercel Deployment and Strict TS Checking:** We learned that Vercel enforces strict TypeScript checks (`tsc -b`) during the build process, which can block deployments even if the local development server works fine. This highlighted the importance of addressing TS errors immediately rather than accumulating technical debt.
- **Mixed Content Security Policies:** We discovered that modern browsers enforce strict Mixed Content policies, preventing our HTTPS Vercel frontend from communicating with an HTTP backend. This forced us to learn how to properly set up a reverse proxy (Nginx) and SSL certificates (Certbot) on our public VPS.

## Validated assumptions
- **FastAPI / Uvicorn Stability:** The assumption that FastAPI would be lightweight and robust enough for our backend was validated. It successfully handled the LLM integration and stood up well behind the Nginx reverse proxy.
- **Docker Networking:** The assumption that we could seamlessly connect the backend to the `testbd_postgres` database via Docker's internal network (`testbd_postgres:5432`) without exposing ports unnecessarily was validated.

## Friction and gaps
- **Frontend State Management:** We experienced some friction with React state updates, particularly a bug where the "Add new DB" button would disappear if the list of existing databases was empty. 
- **Networking Complexity:** There was a significant gap in understanding how to bridge the public VPS and the university VM. The timeout errors revealed that we needed a reverse SSH tunnel (`ssh -R`) to expose the backend to the public internet securely.

## Planned response
- **Stricter Local Linting:** We will integrate TypeScript checks into our pre-commit hooks to ensure no TS errors make it into the `develop` branch, avoiding future Vercel build failures.
- **Infrastructure as Code (IaC):** We plan to document the exact reverse SSH tunnel commands and Nginx configurations in our root documentation so that any team member can bring the environment back up quickly if the university VM restarts.
