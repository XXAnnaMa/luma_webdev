from uuid import UUID

from sqlalchemy.exc import IntegrityError

from luma.repositories.event_repository import EventRepository
from luma.repositories.registration_repository import RegistrationRepository


class RegistrationError(Exception):
    """Domain error raised when a registration action cannot be completed."""

    def __init__(self, detail: str, status_code: int = 400) -> None:
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


class RegistrationService:
    """Business rules for event registration/unregistration."""

    def __init__(
        self,
        registration_repo: RegistrationRepository,
        event_repo: EventRepository,
    ) -> None:
        self.registration_repo = registration_repo
        self.event_repo = event_repo

    async def get_registered_event_ids(self, user_id: int, event_ids: list[UUID]) -> set[UUID]:
        """Return the subset of event_ids that the user is registered for."""
        return await self.registration_repo.get_registered_event_ids(user_id, event_ids)

    async def is_registered(self, event_id: UUID, user_id: int) -> bool:
        """Check if a user is registered for a specific event."""
        return await self.registration_repo.is_registered(event_id, user_id)

    async def register(self, event_id: UUID, user_id: int) -> int:
        """Register user for event. Returns updated participant count.

        Raises RegistrationError if:
        - event does not exist
        - user is the event organizer
        - user is already registered
        - event is at capacity
        """
        event = await self.event_repo.get_by_id_for_update(event_id)
        if event is None:
            raise RegistrationError("Event not found", status_code=404)

        if event.user_id == user_id:
            raise RegistrationError("Organizers cannot register for their own events")

        current_count = await self.registration_repo.count_by_event(event_id)
        if current_count >= event.participant_limit:
            raise RegistrationError("Event is at capacity", status_code=409)

        try:
            await self.registration_repo.create(event_id, user_id)
        except IntegrityError as exc:
            orig = getattr(exc, "orig", exc)
            constraint = getattr(orig, "constraint_name", None)
            
            # Use structured constraint name if available, otherwise fallback to message string
            if (
                constraint == "uq_event_registrations_event_user"
                or "uq_event_registrations_event_user" in str(orig)
            ):
                raise RegistrationError(
                    "Already registered for this event", status_code=409
                ) from exc
            raise
        count = await self.registration_repo.update_participant_count(event_id)
        await self.registration_repo.commit()
        return count

    async def unregister(self, event_id: UUID, user_id: int) -> int:
        """Unregister user from event. Returns updated participant count.

        Raises RegistrationError if:
        - event does not exist
        - user is not registered
        """
        event = await self.event_repo.get_by_id_for_update(event_id)
        if event is None:
            raise RegistrationError("Event not found", status_code=404)

        deleted = await self.registration_repo.delete(event_id, user_id)
        if not deleted:
            raise RegistrationError("Not registered for this event", status_code=409)

        count = await self.registration_repo.update_participant_count(event_id)
        await self.registration_repo.commit()
        return count
