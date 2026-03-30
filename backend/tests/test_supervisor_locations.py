from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from app.services import supervisor_location_service


async def test_list_locations_maps_rows():
    created_at = datetime(2026, 3, 29, 10, 0, tzinfo=timezone.utc)
    rows = [{"id": "loc-1", "name": "Science Lab", "createdAt": created_at}]

    with patch("app.services.supervisor_location_service.db") as mock_db:
        mock_db.query_raw = AsyncMock(return_value=rows)

        result = await supervisor_location_service.list_locations("sup-1")

    assert result == [{"id": "loc-1", "name": "Science Lab", "created_at": created_at}]


async def test_create_location_blocks_duplicate_name_case_insensitive():
    supervisor = MagicMock()

    with patch("app.services.supervisor_location_service.db") as mock_db:
        mock_db.supervisor.find_unique = AsyncMock(return_value=supervisor)
        mock_db.query_raw = AsyncMock(return_value=[{"id": "loc-existing"}])

        with pytest.raises(HTTPException) as exc_info:
            await supervisor_location_service.create_location("sup-1", "science lab")

    assert exc_info.value.status_code == 409
    assert "already exists" in str(exc_info.value.detail).lower()


async def test_create_location_inserts_and_returns_location():
    supervisor = MagicMock()
    created_at = datetime(2026, 3, 29, 12, 0, tzinfo=timezone.utc)

    with patch("app.services.supervisor_location_service.db") as mock_db:
        mock_db.supervisor.find_unique = AsyncMock(return_value=supervisor)
        mock_db.query_raw = AsyncMock(
            side_effect=[[], [{"id": "loc-2", "name": "Library Annex", "createdAt": created_at}]]
        )
        mock_db.execute_raw = AsyncMock()

        result = await supervisor_location_service.create_location("sup-1", "Library Annex")

    assert result == {"id": "loc-2", "name": "Library Annex", "created_at": created_at}
    assert mock_db.execute_raw.await_count == 1
