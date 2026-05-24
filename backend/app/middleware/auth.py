"""FastAPI dependencies for Supabase JWT authentication."""
from fastapi import Header, HTTPException
from app.services.supabase_client import get_supabase


async def get_optional_user(authorization: str | None = Header(None)):
    """Returns Supabase User or None — use for endpoints that work for both."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    try:
        resp = get_supabase().auth.get_user(token)
        return resp.user
    except Exception:
        return None


async def require_user(authorization: str | None = Header(None)):
    """Returns Supabase User or raises HTTP 401 — use for protected endpoints."""
    user = await get_optional_user(authorization)
    if user is None:
        raise HTTPException(status_code=401, detail="Autenticazione richiesta.")
    return user
