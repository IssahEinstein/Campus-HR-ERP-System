import asyncio
import logging
import smtplib
import ssl
from dataclasses import dataclass
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

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
    return 400 <= code < 500


def _format_smtp_message(message: bytes | str | None) -> str:
    if message is None:
        return "No SMTP message returned"
    if isinstance(message, bytes):
        return message.decode("utf-8", errors="replace")
    return str(message)


def _extract_recipients_refused_error(to: str, exc: smtplib.SMTPRecipientsRefused) -> EmailDeliveryError:
    recipient = to
    smtp_code: int | None = None
    smtp_message = "Recipient rejected"

    if exc.recipients:
        recipient, details = next(iter(exc.recipients.items()))
        if isinstance(details, tuple) and len(details) >= 2:
            smtp_code = details[0]
            smtp_message = _format_smtp_message(details[1])
        else:
            smtp_message = _format_smtp_message(details)

    return EmailDeliveryError(
        recipient=recipient,
        reason=f"Recipient rejected by SMTP server: {smtp_message}",
        smtp_code=smtp_code,
        transient=_is_transient_smtp_code(smtp_code),
    )


async def send_invite_email(to: str, name: str, role: str, invite_link: str) -> None:
    """
    Send an invitation email with a password-setup link.
    Falls back to printing the link when SMTP is not configured (local dev).
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

    if not settings.SMTP_FROM or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        # Email not configured — print the link so it's visible in dev logs
        print(f"[DEV] Invite link for {name} ({to}): {invite_link}")
        return

    def _send_once() -> None:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM
        msg["To"] = to
        msg.attach(MIMEText(html_body, "html"))

        use_ssl = settings.SMTP_PORT == 465
        smtp_cls = smtplib.SMTP_SSL if use_ssl else smtplib.SMTP
        context = ssl.create_default_context()

        logger.info(
            "Sending invite email via SMTP host=%s port=%s ssl=%s to=%s",
            settings.SMTP_HOST,
            settings.SMTP_PORT,
            use_ssl,
            to,
        )

        try:
            with smtp_cls(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30) as smtp:
                if settings.SMTP_DEBUG:
                    smtp.set_debuglevel(1)
                smtp.ehlo()
                if not use_ssl:
                    smtp.starttls(context=context)
                    smtp.ehlo()
                smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                refused = smtp.sendmail(settings.SMTP_FROM, [to], msg.as_string())
                if refused:
                    raise smtplib.SMTPRecipientsRefused(refused)
        except smtplib.SMTPRecipientsRefused as exc:
            raise _extract_recipients_refused_error(to, exc) from exc
        except smtplib.SMTPResponseException as exc:
            smtp_message = _format_smtp_message(exc.smtp_error)
            raise EmailDeliveryError(
                recipient=to,
                reason=f"SMTP rejected message: {smtp_message}",
                smtp_code=exc.smtp_code,
                transient=_is_transient_smtp_code(exc.smtp_code),
            ) from exc
        except (smtplib.SMTPServerDisconnected, OSError, TimeoutError) as exc:
            raise EmailDeliveryError(
                recipient=to,
                reason=f"Network/SMTP connection issue: {exc}",
                transient=True,
            ) from exc
        except smtplib.SMTPException as exc:
            raise EmailDeliveryError(
                recipient=to,
                reason=f"SMTP error: {exc}",
                transient=False,
            ) from exc

        logger.info("Invite email accepted by SMTP relay for to=%s", to)

    retries = max(0, settings.SMTP_MAX_RETRIES)
    delay_seconds = max(0.0, settings.SMTP_RETRY_DELAY_SECONDS)

    for attempt in range(1, retries + 2):
        try:
            await asyncio.to_thread(_send_once)
            return
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
