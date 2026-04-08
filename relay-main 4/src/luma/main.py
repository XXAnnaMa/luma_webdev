from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from luma.api.router import api_router
from luma.core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        debug=settings.effective_debug,
        docs_url="/docs" if settings.effective_docs_enabled else None,
        redoc_url="/redoc" if settings.effective_redoc_enabled else None,
        openapi_url="/openapi.json" if settings.effective_openapi_enabled else None,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Keep local setup friction low; enforce trusted host checks outside local/dev/test.
    if not settings.is_local and settings.trusted_hosts:
        app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_hosts)

    app.include_router(api_router, prefix=settings.api_v1_prefix)
    return app


app = create_app()
