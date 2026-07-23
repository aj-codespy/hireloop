"""Scoped API key authentication for the HireLoop REST API (v1).

Keys are stored as bcrypt hashes (column ``key_hash``). The plaintext key is
only ever returned once, at creation time. We verify by hashing the presented
key and matching against the stored hash. Scopes are enforced per-route via
the ``require_scopes`` dependency below.
"""

from __future__ import annotations

import bcrypt
import hmac
import secrets
from dataclasses import dataclass
from typing import Iterable

SCOPE_READ = "read"
SCOPE_WRITE = "write"
SCOPE_ADMIN = "admin"

# Resource-scoped scopes used by the v1 router.
SCOPES = {
    "jobs": {SCOPE_READ, SCOPE_WRITE},
    "applications": {SCOPE_READ, SCOPE_WRITE},
    "candidates": {SCOPE_READ, SCOPE_WRITE},
    "scores": {SCOPE_READ},
    "stages": {SCOPE_READ, SCOPE_WRITE},
    "scorecards": {SCOPE_READ, SCOPE_WRITE},
    "schedules": {SCOPE_READ, SCOPE_WRITE},
    "offers": {SCOPE_READ, SCOPE_WRITE},
    "webhooks": {SCOPE_READ, SCOPE_WRITE, SCOPE_ADMIN},
    "exports": {SCOPE_READ, SCOPE_WRITE, SCOPE_ADMIN},
    "api_keys": {SCOPE_READ, SCOPE_WRITE, SCOPE_ADMIN},
    "calendar": {SCOPE_READ, SCOPE_WRITE},
    "proctoring": {SCOPE_READ, SCOPE_WRITE},
    "scoring": {SCOPE_READ, SCOPE_WRITE},
}


@dataclass(frozen=True)
class AuthenticatedKey:
    key_id: str
    org_id: str
    scopes: frozenset[str]


def generate_key() -> tuple[str, str, str]:
    """Return ``(plaintext, prefix, key_hash)``.

    The plaintext is shown to the user exactly once. We keep an 8-char prefix
    for display and a bcrypt hash for verification.
    """
    raw = f"hl_{secrets.token_urlsafe(32)}"
    prefix = raw[:11]  # "hl_" + 8 chars
    key_hash = bcrypt.hashpw(raw.encode(), bcrypt.gensalt(rounds=12)).decode()
    return raw, prefix, key_hash


def verify_key(plaintext: str, key_hash: str) -> bool:
    """Constant-time verify a presented key against a stored bcrypt hash."""
    try:
        return bcrypt.checkpw(plaintext.encode(), key_hash.encode())
    except (ValueError, TypeError):
        return False


def normalize_scopes(scopes: Iterable[str]) -> frozenset[str]:
    """Lower-case and validate against the known scope vocabulary."""
    out: set[str] = set()
    for s in scopes:
        s = (s or "").strip().lower()
        if s in (SCOPE_READ, SCOPE_WRITE, SCOPE_ADMIN):
            out.add(s)
    return frozenset(out)


def has_scope(key: AuthenticatedKey, required: str) -> bool:
    """``admin`` satisfies any scope; otherwise the exact scope must be present."""
    if SCOPE_ADMIN in key.scopes:
        return True
    return required in key.scopes
