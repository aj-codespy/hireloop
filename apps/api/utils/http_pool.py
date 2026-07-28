import httpx
import asyncio
import random
from typing import Optional, Any

_http_client: Optional[httpx.AsyncClient] = None


def get_http_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None:
        _http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0),
            limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
        )
    return _http_client


async def init_http_client() -> None:
    global _http_client
    if _http_client is None:
        _http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0),
            limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
        )


async def close_http_client() -> None:
    global _http_client
    if _http_client is not None:
        await _http_client.aclose()
        _http_client = None


async def request_with_retry(
    method: str,
    url: str,
    *,
    headers: dict | None = None,
    params: dict | None = None,
    json: Any = None,
    content: Any = None,
    timeout: float = 30.0,
    retries: int = 3,
) -> httpx.Response:
    """Perform an HTTP request with a simple exponential backoff retry on transient errors.

    Retries on network errors and 5xx responses.
    """
    client = get_http_client()
    last_exc: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            res = await client.request(
                method, url, headers=headers, params=params, json=json, content=content, timeout=timeout
            )
            # Retry on server errors (5xx)
            if res.status_code >= 500 and attempt < retries:
                last_exc = RuntimeError(f"HTTP {res.status_code}")
                await asyncio.sleep((2 ** (attempt - 1)) + random.random())
                continue
            return res
        except Exception as exc:
            last_exc = exc
            if attempt == retries:
                raise
            await asyncio.sleep((2 ** (attempt - 1)) + random.random())
    # Should not reach here, but mypy wants a raise
    raise last_exc or RuntimeError("request_with_retry failed")
