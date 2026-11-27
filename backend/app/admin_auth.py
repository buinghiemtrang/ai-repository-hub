"""Shared admin credential guard for write/admin endpoints across modules."""
import hmac
import os

from fastapi import HTTPException


def require_admin_key(x_admin_key: str | None, authorization: str | None) -> None:
    """Validate X-Admin-Key or Bearer token against ADMIN_API_KEY using constant-time comparison.

    Raises 503 when no key is configured (admin endpoints stay disabled) and 401 on mismatch.
    """
    configured_key = os.getenv("ADMIN_API_KEY", "").strip()
    if not configured_key:
        raise HTTPException(503, "Admin sync endpoint is disabled until ADMIN_API_KEY is configured.")

    provided = (x_admin_key or "").strip()
    if not provided and authorization and authorization.lower().startswith("bearer "):
        provided = authorization[7:].strip()
    if not provided or not hmac.compare_digest(provided, configured_key):
        raise HTTPException(401, "Invalid or missing admin credentials.")
