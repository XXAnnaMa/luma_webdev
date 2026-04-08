from fastapi import APIRouter

from luma.api.routes.auth import router as auth_router
from luma.api.routes.chat import router as chat_router
from luma.api.routes.events import router as events_router
from luma.api.routes.health import router as health_router
from luma.api.routes.match import router as match_router
from luma.api.routes.users import router as users_router

api_router = APIRouter()
api_router.include_router(health_router, prefix="/health", tags=["health"])
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(events_router, prefix="/events", tags=["events"])

api_router.include_router(match_router, prefix="/match", tags=["match"])
api_router.include_router(chat_router, prefix="/chat", tags=["chat"])

