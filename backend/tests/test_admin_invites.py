from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from app.services import invite_service


async def test_resend_admin_invite_forbidden_for_non_inviter():
    requester_admin_id = "admin-requester-id"
    inviter_admin_id = "admin-inviter-id"

    requester = MagicMock()
    requester.id = requester_admin_id

    invite = MagicMock()
    invite.usedAt = None
    invite.invitedByAdminId = inviter_admin_id

    invited_user = MagicMock()
    invited_user.adminInvite = invite

    invited_admin = MagicMock()
    invited_admin.user = invited_user

    with patch("app.services.invite_service.db") as mock_db:
        mock_db.admin.find_unique = AsyncMock(side_effect=[requester, invited_admin])

        with pytest.raises(HTTPException) as exc_info:
            await invite_service.resend_admin_invite(
                admin_profile_id="target-admin-profile-id",
                requester_admin_id=requester_admin_id,
            )

    assert exc_info.value.status_code == 403
    assert "inviting admin" in str(exc_info.value.detail).lower()
