import secrets

import bcrypt


def hash_password(plain: str) -> str:
    """Return a bcrypt hash of *plain*."""
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    """Return ``True`` when *plain* matches *hashed*.

    Returns ``False`` (instead of raising) when *hashed* is empty,
    malformed, or otherwise not a valid bcrypt hash string.
    """
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except (ValueError, TypeError):
        return False


def generate_session_id() -> str:
    """Return a cryptographically-random URL-safe session token."""
    return secrets.token_urlsafe(32)
