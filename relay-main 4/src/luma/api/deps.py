from typing import Annotated

from fastapi import Cookie, HTTPException, status

from luma.cache.session import get_session
from luma.core.config import settings


async def get_current_user_id(
    session_id: Annotated[str | None, Cookie(alias=settings.session_cookie_name)] = None,
) -> int:
    """Extract the current user's ID from the session cookie.

    Looks up the session in Redis and returns the associated user ID.
    Raises 401 if the cookie is missing or the session has expired.
    """
    if session_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    user_id = await get_session(session_id)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid",
        )
    return user_id


async def get_optional_current_user_id(
    session_id: Annotated[str | None, Cookie(alias=settings.session_cookie_name)] = None,
) -> int | None:
    """Extract the current user's ID from the session cookie without failing if missing.

    Looks up the session in Redis and returns the associated user ID.
    Returns None if the cookie is missing or the session has expired.
    """
    if session_id is None:
        return None
    
    user_id = await get_session(session_id)
    return user_id
