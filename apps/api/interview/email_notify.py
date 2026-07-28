"""Interview notification emails via SMTP (Brevo relay)."""

from __future__ import annotations

import logging
import ssl

import aiosmtplib
from email.mime.text import MIMEText

from config import APP_URL, BREVO_SMTP_HOST, BREVO_SMTP_PORT, BREVO_SMTP_LOGIN, BREVO_SMTP_KEY, BREVO_FROM, BREVO_FROM_NAME, email_configured
from utils.mask import mask_email, mask_name

logger = logging.getLogger(__name__)


async def _send_email_smtp(
    to_email: str,
    to_name: str,
    subject: str,
    html: str,
) -> None:
    """Send an email via Brevo SMTP relay."""
    msg = MIMEText(html, "html")
    msg["From"] = f"{BREVO_FROM_NAME} <{BREVO_FROM}>"
    msg["To"] = f"{to_name} <{to_email}>"
    msg["Subject"] = subject

    await aiosmtplib.send(
        msg,
        hostname=BREVO_SMTP_HOST,
        port=BREVO_SMTP_PORT,
        username=BREVO_SMTP_LOGIN,
        password=BREVO_SMTP_KEY,
        use_tls=False,
        start_tls=True,
        timeout=30,
    )


async def send_interview_expired_email(
    *,
    candidate_email: str,
    candidate_name: str,
    job_title: str,
) -> None:
    """Notify candidate that their interview link or reconnect window has expired."""
    if not candidate_email:
        logger.warning("Skipping expired interview email — no candidate email")
        return

    if not email_configured():
        logger.info(
            "INTERVIEW EXPIRED EMAIL (Brevo SMTP not configured) → %s <%s> for role %r",
            mask_name(candidate_name),
            mask_email(candidate_email),
            job_title,
        )
        return

    html = f"""
        <p>Hi {candidate_name},</p>
        <p>Your interview window for <strong>{job_title}</strong> has ended, so you can no longer continue the interview online.</p>
        <p>If you still need to complete your interview, please reply to the hiring team or wait for them to send you a new link.</p>
        <p><a href="{APP_URL}">Visit HireLoop</a></p>
    """

    try:
        await _send_email_smtp(
            to_email=candidate_email,
            to_name=candidate_name,
            subject=f"Interview window ended — {job_title}",
            html=html,
        )
        logger.info(
            "Sent expired interview email → %s <%s> for role %r",
            candidate_name,
            candidate_email,
            job_title,
        )
    except Exception as exc:
        logger.exception("Error sending expired interview email to %s: %s", candidate_email, exc)


async def send_interview_invite_email(
    *,
    candidate_email: str,
    candidate_name: str,
    job_title: str,
    interview_url: str,
    expires_at: str,
) -> None:
    """Notify candidate that they have been invited to an interview round."""
    if not candidate_email:
        logger.warning("Skipping invite email — no candidate email")
        return

    if not email_configured():
        logger.info(
            "INTERVIEW INVITE EMAIL (Brevo SMTP not configured) → %s <%s> for role %r\nURL: %s",
            mask_name(candidate_name),
            mask_email(candidate_email),
            job_title,
            interview_url,
        )
        return

    # Parse and format the expiration date if possible
    try:
        from datetime import datetime, timezone
        exp_dt = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        # Format as e.g. "January 1, 2026 at 12:00 PM UTC"
        expires_str = exp_dt.strftime("%B %d, %Y at %I:%M %p UTC")
    except Exception:
        expires_str = expires_at

    html = f"""
        <p>Hi {candidate_name},</p>
        <p>You have been invited to the next interview round for <strong>{job_title}</strong>!</p>
        <p>Please use the link below to start your interview. The link will expire on {expires_str}.</p>
        <p><a href="{interview_url}">Start Interview</a></p>
    """

    try:
        await _send_email_smtp(
            to_email=candidate_email,
            to_name=candidate_name,
            subject=f"Interview Invitation — {job_title}",
            html=html,
        )
        logger.info(
            "Sent interview invite email → %s <%s> for role %r",
            candidate_name,
            candidate_email,
            job_title,
        )
    except Exception as exc:
        logger.exception("Error sending interview invite email to %s: %s", candidate_email, exc)

