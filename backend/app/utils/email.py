import asyncio
import logging
from dataclasses import dataclass

import httpx

from app.core.config import settings

logger = logging.getLogger("task_app.email")


@dataclass
class EmailDeliveryError(Exception):
    recipient: str
    reason: str
    smtp_code: int | None = None
    transient: bool = False


def _is_transient_smtp_code(code: int | None) -> bool:
    if code is None:
        return False
    return 400 <= code < 500 or code == 429


def _format_http_message(message: bytes | str | None) -> str:
    if message is None:
        return "No response message returned"
    if isinstance(message, bytes):
        return message.decode("utf-8", errors="replace")
    return str(message)


async def send_invite_email(to: str, name: str, role: str, invite_link: str) -> None:
    """
    Send an invitation email with a password-setup link through Resend.
    Falls back to printing the link when the email provider is not configured for local dev.
    """
    subject = f"You've been invited as a {role} — Campus HR ERP"
    html_body = f"""
    <html>
      <body style="font-family:sans-serif;line-height:1.6;color:#333">
        <h2>Hello, {name}!</h2>
        <p>You have been invited to join the <strong>Campus HR ERP System</strong>
           as a <strong>{role}</strong>.</p>
        <p>Your temporary password is your assigned ID. Use the invitation link below to set your permanent password before signing in.</p>
        <p>Click the button below to set your password and activate your account:</p>
        <p>
          <a href="{invite_link}"
             style="background:#2563eb;color:#fff;padding:12px 24px;
                    border-radius:6px;text-decoration:none;display:inline-block;">
            Accept Invitation
          </a>
        </p>
        <p>This link expires in <strong>48 hours</strong>.</p>
        <hr/>
        <p style="color:#888;font-size:12px;">
          If you were not expecting this invitation, you can safely ignore this email.
        </p>
      </body>
    </html>
    """

    if not settings.SMTP_FROM or not settings.RESEND_API_KEY:
        is_local_frontend = (
            settings.FRONTEND_URL.startswith("http://localhost")
            or settings.FRONTEND_URL.startswith("http://127.0.0.1")
        )
        if is_local_frontend:
            print(f"[DEV] Invite link for {name} ({to}): {invite_link}")
            return

        raise EmailDeliveryError(
            recipient=to,
            reason="Resend email provider is not configured (SMTP_FROM/RESEND_API_KEY)",
            transient=False,
        )

    smtp_timeout_seconds = max(1.0, float(settings.SMTP_TIMEOUT_SECONDS))
    api_url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {settings.RESEND_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "from": settings.SMTP_FROM,
        "to": [to],
        "subject": subject,
        "html": html_body,
    }

    async def _send_once() -> None:
        logger.info("Sending invite email via Resend to=%s", to)

        async with httpx.AsyncClient(timeout=httpx.Timeout(smtp_timeout_seconds)) as client:
            try:
                response = await client.post(api_url, json=payload, headers=headers)
            except httpx.RequestError as exc:
                raise EmailDeliveryError(
                    recipient=to,
                    reason=f"Network error when contacting Resend: {exc}",
                    transient=True,
                ) from exc

        if response.is_error:
            body_text = response.text
            message = None
            try:
                data = response.json()
                message = data.get("error", {}).get("message") or data.get("message")
            except ValueError:
                message = body_text

            error_message = _format_http_message(message)
            raise EmailDeliveryError(
                recipient=to,
                reason=(
                    f"Resend rejected message: {error_message}"
                ),
                smtp_code=response.status_code,
                transient=_is_transient_smtp_code(response.status_code),
            )

        logger.info("Invite email accepted by Resend for to=%s", to)

    retries = max(0, settings.SMTP_MAX_RETRIES)
    delay_seconds = max(0.0, settings.SMTP_RETRY_DELAY_SECONDS)

    for attempt in range(1, retries + 2):
        try:
            await asyncio.wait_for(
                _send_once(),
                timeout=smtp_timeout_seconds + 2.0,
            )
            return
        except asyncio.TimeoutError as exc:
            timed_out_error = EmailDeliveryError(
                recipient=to,
                reason=(
                    "Resend operation timed out after "
                    f"{smtp_timeout_seconds:.1f}s"
                ),
                transient=True,
            )
            has_next_attempt = attempt <= retries
            logger.warning(
                "Invite email attempt %s timed out for to=%s timeout=%ss",
                attempt,
                to,
                smtp_timeout_seconds,
            )

            if not has_next_attempt:
                raise timed_out_error from exc

            await asyncio.sleep(delay_seconds * attempt)
        except EmailDeliveryError as exc:
            has_next_attempt = attempt <= retries
            logger.warning(
                "Invite email attempt %s failed for to=%s transient=%s smtp_code=%s reason=%s",
                attempt,
                exc.recipient,
                exc.transient,
                exc.smtp_code,
                exc.reason,
            )

            if not has_next_attempt or not exc.transient:
                raise

            await asyncio.sleep(delay_seconds * attempt)
