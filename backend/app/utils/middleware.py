from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.utils.ip_auth import get_client_ip, is_ip_allowed
from app.config import settings


class IPWhitelistMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if path.startswith(("/auth/", "/docs", "/redoc", "/openapi.json", "/favicon.ico")):
            return await call_next(request)

        ip = get_client_ip(request)
        if not is_ip_allowed(ip):
            from app.utils.exceptions import ForbiddenError
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=403,
                content={"detail": "Доступ запрещён: ваш IP-адрес не в разрешённых подсетях"},
            )
        return await call_next(request)
