from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from src.services.auth import AuthService
from src.database.session import SessionLocal
from src.services.users import UserService

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Default to None
        request.state.user = None
        
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "")
            payload = AuthService.decode_token(token)
            
            if payload:
                user_id_str = payload.get("sub")
                if user_id_str:
                    try:
                        from uuid import UUID
                        user_id = UUID(user_id_str)
                        
                        db = SessionLocal()
                        try:
                            user_service = UserService(db)
                            user = user_service.get_user(user_id)
                            if user:
                                request.state.user = user
                        finally:
                            db.close()
                    except (ValueError, ImportError):
                        pass
        
        response = await call_next(request)
        return response
