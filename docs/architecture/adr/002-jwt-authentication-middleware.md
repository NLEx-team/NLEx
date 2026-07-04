# ADR-002: JWT Authentication Middleware

## Status
Accepted

## Context
The system processes sensitive natural language queries and returns corporate data. We need to ensure that only authenticated users can access the core API endpoints. 

## Decision
We decided to use stateless **JWT (JSON Web Token) Authentication** enforced via a centralized FastAPI dependency middleware. All protected endpoints must require the `Depends(get_current_user)` injection.

## Consequences
* **Positive**: Fully satisfies **QR-002 (Security - Authenticity)** by rejecting unauthenticated requests at the router level. It is stateless, making it easy to scale the backend in the future without session affinity issues.
* **Negative**: Token revocation is more complex than stateful sessions; we have to rely on short expiration times and refresh token logic if needed in the future.
