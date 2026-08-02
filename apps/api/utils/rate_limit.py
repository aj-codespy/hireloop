"""Shared slowapi limiter so both main.py and routes/v1.py throttle consistently."""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
