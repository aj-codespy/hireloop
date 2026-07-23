"""Interview notification emails via Brevo (SendinBlue) API."""

from __future__ import annotations

import logging

import httpx

from config import APP_URL, BREVO_API_KEY, BREVO_FROM, BREVO_FROM_NAME, email_configured
from utils.http_pool import get_http_client

logger = logging.getLogger(__name__)

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


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
            "INTERVIEW EXPIRED EMAIL (Brevo not configured) → %s <%s> for role %r",
            candidate_name,
            candidate_email,
            job_title,
        )
        return

    html = f"""
        <p>Hi {candidate_name},</p>
        <p>Your interview window for <strong>{job_title}</strong> has ended, so you can no longer continue the interview online.</p>
        <p>If you still need to complete your interview, please reply to the hiring team or wait for them to send you a new link.</p>
        <p><a href="{APP_URL}">Visit HireLoop</a></p>
    """

    payload = {
        "sender": {"name": BREVO_FROM_NAME, "email": BREVO_FROM},
        "to": [{"email": candidate_email, "name": candidate_name}],
        "subject": f"Interview window ended — {job_title}",
        "htmlContent": html,
    }

    try:
        client = get_http_client()
        response = await client.post(
            BREVO_API_URL,
            headers={
                "api-key": BREVO_API_KEY,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            json=payload,
            timeout=30.0,
        )
        if response.status_code >= 400:
            logger.error(
                "Failed to send expired interview email to %s: %s",
                candidate_email,
                response.text,
            )
            return
        logger.info(
            "Sent expired interview email → %s <%s> for role %r",
            candidate_name,
            candidate_email,
            job_title,
        )
    except Exception as exc:
        logger.exception("Error sending expired interview email to %s: %s", candidate_email, exc)

