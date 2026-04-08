from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError

from luma.core.security import hash_password, verify_password
from luma.db.models.user import User
from luma.repositories.user_repository import UserRepository
from luma.schemas.user import SignupRequest

# Pre-computed bcrypt hash used as a timing-safe dummy when the looked-up user
# does not exist, so verify_password always runs regardless of whether the
# email was found.
_DUMMY_HASH = "$2b$12$KIXSKTaVVBDaFDEupAFnz.8F8v3XNwGvjRFlJWKGYh4vfj3GwE3z2"


class AuthService:
    """Business rules for authentication."""

    def __init__(self, repository: UserRepository) -> None:
        self.repository = repository

    async def signup(self, payload: SignupRequest) -> User:
        """Register a new user. Raises 409 if email already taken."""
        normalized_email = payload.email.strip().lower()
        existing = await self.repository.get_by_email(normalized_email)
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )
        hashed = hash_password(payload.password)
        try:
            return await self.repository.create_user(
                email=normalized_email,
                full_name=payload.full_name.strip(),
                hashed_password=hashed,
            )
        except IntegrityError:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            ) from None

    async def authenticate(self, email: str, password: str) -> User:
        """Verify credentials. Raises 401 on failure."""
        user = await self.repository.get_by_email(email.strip().lower())
        candidate_hash = user.hashed_password if user is not None else _DUMMY_HASH
        if not verify_password(password, candidate_hash) or user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive",
            )
        return user
