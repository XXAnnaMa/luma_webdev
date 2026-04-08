from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from luma.api.deps import get_current_user_id
from luma.cache.session import create_session, delete_session
from luma.core.config import settings
from luma.db.models.user import User
from luma.db.session import get_db_session
from luma.repositories.user_repository import UserRepository
from luma.schemas.user import LoginRequest, SignupRequest, UserRead
from luma.services.auth_service import AuthService

router = APIRouter()


def _get_auth_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AuthService:
    return AuthService(UserRepository(session))


def _set_session_cookie(response: Response, session_id: str) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=session_id,
        httponly=True,
        samesite="lax",
        secure=not settings.is_local,
        path="/",
        max_age=settings.session_ttl_seconds,
    )


@router.post("/signup", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def signup(
    payload: SignupRequest,
    response: Response,
    service: Annotated[AuthService, Depends(_get_auth_service)],
) -> UserRead:
    user = await service.signup(payload)
    session_id = await create_session(user.id)
    _set_session_cookie(response, session_id)
    return UserRead.model_validate(user)


@router.post("/login", response_model=UserRead)
async def login(
    payload: LoginRequest,
    response: Response,
    service: Annotated[AuthService, Depends(_get_auth_service)],
) -> UserRead:
    user = await service.authenticate(payload.email, payload.password)
    session_id = await create_session(user.id)
    _set_session_cookie(response, session_id)
    return UserRead.model_validate(user)


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    response: Response,
    session_id: Annotated[str | None, Cookie(alias=settings.session_cookie_name)] = None,
) -> dict[str, str]:
    if session_id:
        await delete_session(session_id)
    response.delete_cookie(
        key=settings.session_cookie_name,
        httponly=True,
        samesite="lax",
        secure=not settings.is_local,
        path="/",
    )
    return {"detail": "Logged out"}


@router.get("/me", response_model=UserRead)
async def me(
    user_id: Annotated[int, Depends(get_current_user_id)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> UserRead:
    stmt = select(User).where(User.id == user_id)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return UserRead.model_validate(user)
