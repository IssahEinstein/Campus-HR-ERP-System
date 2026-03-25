"""
Role guard placeholders.
These will be replaced by Issah's real auth middleware once auth is complete.
Usage:
    @router.post("/shifts")
    async def create_shift(supervisor=Depends(require_supervisor)):
        ...
"""
from fastapi import Header, HTTPException


async def require_supervisor(x_user_id: str = Header(...), x_user_role: str = Header(...)) -> dict:
    """
    Placeholder: expects X-User-Id and X-User-Role headers.
    Issah's auth middleware will inject these after verifying the JWT.
    """
    if x_user_role not in ("SUPERVISOR", "ADMIN"):
        raise HTTPException(status_code=403, detail="Supervisors or admins only")
    return {"user_id": x_user_id, "role": x_user_role}


async def require_worker(x_user_id: str = Header(...), x_user_role: str = Header(...)) -> dict:
    """
    Placeholder: expects X-User-Id and X-User-Role headers.
    """
    if x_user_role not in ("WORKER", "SUPERVISOR", "ADMIN"):
        raise HTTPException(status_code=403, detail="Workers only")
    return {"user_id": x_user_id, "role": x_user_role}


async def require_any_role(x_user_id: str = Header(...), x_user_role: str = Header(...)) -> dict:
    """
    Placeholder: any authenticated user.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"user_id": x_user_id, "role": x_user_role}
