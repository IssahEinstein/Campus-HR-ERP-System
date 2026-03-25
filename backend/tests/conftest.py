"""
Shared pytest fixtures for the Campus HR ERP test suite.

All tests use an httpx.AsyncClient backed by the FastAPI ASGI app directly.
The ASGI transport does NOT trigger lifespan events, so the Prisma client is
never actually connected — all DB operations must be mocked per-test.
"""
import httpx
import pytest

from app.auth.tokens import create_access_token


# ---------------------------------------------------------------------------
# HTTP test client
# ---------------------------------------------------------------------------

@pytest.fixture
async def client():
    """Async HTTPX client wired to the FastAPI app (no real DB connection)."""
    from app.main import app

    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


# ---------------------------------------------------------------------------
# JWT token helpers — one per role
# ---------------------------------------------------------------------------

@pytest.fixture
def admin_token() -> str:
    return create_access_token(
        subject="admin-user-id",
        role="ADMIN",
        email="admin@test.com",
        profile_id="admin-profile-id",
    )


@pytest.fixture
def supervisor_token() -> str:
    return create_access_token(
        subject="sup-user-id",
        role="SUPERVISOR",
        email="supervisor@test.com",
        profile_id="sup-profile-id",
    )


@pytest.fixture
def worker_token() -> str:
    return create_access_token(
        subject="worker-user-id",
        role="WORKER",
        email="worker@test.com",
        profile_id="worker-profile-id",
    )
