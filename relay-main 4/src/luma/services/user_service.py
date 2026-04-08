from luma.repositories.user_repository import UserRepository
from luma.schemas.user import UserCreate

# A valid bcrypt hash that will never match any real password.
# Used as a placeholder for users created without credentials (e.g. via the
# admin Users API) so that bcrypt.checkpw never receives an invalid hash.
_UNUSABLE_PASSWORD_HASH = "$2b$12$000000000000000000000uAECqpV2ALAfMPUzd0sn6S1d/gtkOFCu"


class UserService:
    """Application business rules for users."""

    def __init__(self, repository: UserRepository) -> None:
        self.repository = repository

    async def list_users(self):
        return await self.repository.list_users()

    async def create_user(self, payload: UserCreate):
        normalized_email = payload.email.strip().lower()
        normalized_name = payload.full_name.strip()
        return await self.repository.create_user(
            email=normalized_email,
            full_name=normalized_name,
            hashed_password=_UNUSABLE_PASSWORD_HASH,
        )
