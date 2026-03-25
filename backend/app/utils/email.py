import asyncio
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings


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

    if not settings.SMTP_FROM or not settings.SMTP_USER:
        # Email not configured — print the link so it's visible in dev logs
        print(f"[DEV] Invite link for {name} ({to}): {invite_link}")
        return

    def _send() -> None:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM
        msg["To"] = to
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.sendmail(settings.SMTP_FROM, to, msg.as_string())

    await asyncio.to_thread(_send)
