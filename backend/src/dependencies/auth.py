from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer
from src.database.models.user import UserRole, User

# security_scheme is defined here because it's a FastAPI/Web-specific concept
security_scheme = HTTPBearer(auto_error=False)

def get_current_user(request: Request, auth = Depends(security_scheme)) -> User:
    """
    Retrieves the user attached to the request by AuthMiddleware.
    The 'auth' dependency (HTTPBearer) enables the 'Authorize' button in Swagger.
    """
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    return user

def require_admin(request: Request, user: User = Depends(get_current_user)) -> User:
    """
    Ensures the current user has admin privileges.
    """
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return user
