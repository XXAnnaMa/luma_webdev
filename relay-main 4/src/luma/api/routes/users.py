from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from luma.db.session import get_db_session
from luma.repositories.user_repository import UserRepository
from luma.schemas.user import UserCreate, UserRead
from luma.services.user_service import UserService

router = APIRouter()


def get_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> UserService:
    repository = UserRepository(session)
    return UserService(repository)


@router.get("", response_model=list[UserRead])
async def list_users(
    service: Annotated[UserService, Depends(get_service)],
) -> list[UserRead]:
    users = await service.list_users()
    return [UserRead.model_validate(user) for user in users]


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreate,
    service: Annotated[UserService, Depends(get_service)],
) -> UserRead:
    user = await service.create_user(payload)
    return UserRead.model_validate(user)
