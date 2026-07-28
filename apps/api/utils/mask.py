"""Utilities for masking PII in logs."""

from __future__ import annotations

from typing import Optional


def mask_email(email: Optional[str]) -> str:
    if not email:
        return ""
    try:
        local, domain = email.split("@", 1)
        if len(local) <= 2:
            return "***@" + domain
        return local[0] + "***" + local[-1] + "@" + domain
    except Exception:
        return "***"


def mask_name(name: Optional[str]) -> str:
    if not name:
        return ""
    parts = name.split()
    return parts[0][0] + "." if parts else name
