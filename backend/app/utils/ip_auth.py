import ipaddress
from typing import List
from fastapi import Request
from app.config import settings


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else ""


def is_ip_allowed(ip: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
        for subnet in settings.app_ip_subnets:
            if addr in ipaddress.ip_network(subnet, strict=False):
                return True
        return False
    except ValueError:
        return False
