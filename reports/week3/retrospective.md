# Retrospective — Week 3

## What went well
1. **Quick Problem Solving:** The team was highly responsive in fixing critical infrastructure bugs, such as the Vercel deployment block and the Mixed Content HTTPS errors.
2. **Successful Backend Exposure:** We successfully set up an Nginx reverse proxy, obtained Let's Encrypt SSL certificates, and established a secure SSH tunnel to expose the university VM to the internet.
3. **Bug Resolution:** We quickly identified and patched the React UI bug in `CatalogList.tsx` that prevented adding new databases when the catalog was empty.

## What did not go well
1. **Accumulated Technical Debt:** We merged code into the `develop` branch with unresolved TypeScript errors, which completely blocked our automated deployments on Vercel.
2. **Infrastructure Confusion:** There was initial confusion regarding how traffic flows from the Vercel frontend -> Public VPS -> University VM, leading to timeouts and connection refused errors.
3. **Misplaced Documentation:** Several assignment artifacts (like `roadmap.md` and `definition-of-done.md`) were initially placed in the wrong directories, deviating from the strict assignment requirements.

## Action points
1. **Enforce Build Checks Before Merge:** Configure GitHub Actions to run `npm run build` (which includes `tsc -b`) on every Pull Request to prevent broken code from entering the `develop` branch.
2. **Create Architecture Diagram:** Draw a clear network architecture diagram showing the relationship between Vercel, the Public VPS (Nginx), the SSH Tunnel, and the University VM, so the whole team understands the data flow.
