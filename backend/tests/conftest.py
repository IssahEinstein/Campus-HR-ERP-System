"""
Shared test configuration and mock DB factory.
Every test module imports `mock_db` from here.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch


def build_mock_db():
    """Build a fully mocked Prisma db object."""
    mock = MagicMock()

    mock.shift.find_unique = AsyncMock()
    mock.shift.find_many = AsyncMock()
    mock.shift.create = AsyncMock()
    mock.shift.update = AsyncMock()
    mock.shift.delete = AsyncMock()

    mock.shiftassignment.find_unique = AsyncMock()
    mock.shiftassignment.find_first = AsyncMock()
    mock.shiftassignment.find_many = AsyncMock()
    mock.shiftassignment.create = AsyncMock()

    mock.worker.find_unique = AsyncMock()
    mock.supervisor.find_unique = AsyncMock()

    mock.checkinout.find_unique = AsyncMock()
    mock.checkinout.find_first = AsyncMock()
    mock.checkinout.find_many = AsyncMock()
    mock.checkinout.create = AsyncMock()
    mock.checkinout.update = AsyncMock()

    mock.timeoffrequest.find_unique = AsyncMock()
    mock.timeoffrequest.find_first = AsyncMock()
    mock.timeoffrequest.find_many = AsyncMock()
    mock.timeoffrequest.create = AsyncMock()
    mock.timeoffrequest.update = AsyncMock()

    mock.paystub.find_unique = AsyncMock()
    mock.paystub.find_first = AsyncMock()
    mock.paystub.find_many = AsyncMock()
    mock.paystub.create = AsyncMock()
    mock.paystub.update = AsyncMock()

    mock.availability.find_unique = AsyncMock()
    mock.availability.find_many = AsyncMock()
    mock.availability.create = AsyncMock()
    mock.availability.update = AsyncMock()
    mock.availability.delete = AsyncMock()

    mock.shiftswaprequest.find_unique = AsyncMock()
    mock.shiftswaprequest.find_first = AsyncMock()
    mock.shiftswaprequest.find_many = AsyncMock()
    mock.shiftswaprequest.create = AsyncMock()
    mock.shiftswaprequest.update = AsyncMock()

    return mock


@pytest.fixture
def mock_db():
    """
    Patch `db` in every service module so tests never touch the real Prisma client.
    Each service does `from app.db import db`, so we patch them individually.
    """
    mock = build_mock_db()
    patches = [
        patch("app.services.shift_service.db", mock),
        patch("app.services.attendance_service.db", mock),
        patch("app.services.timeoff_service.db", mock),
        patch("app.services.payroll_service.db", mock),
        patch("app.services.availability_service.db", mock),
        patch("app.services.shiftswap_service.db", mock),
    ]
    for p in patches:
        p.start()
    yield mock
    for p in patches:
        p.stop()

