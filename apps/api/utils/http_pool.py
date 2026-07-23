import httpx

_http_client: httpx.AsyncClient | None = None

def get_http_client() -> httpx.AsyncClient:
    """Get the shared HTTP client pool instance. Auto-initializes if not yet set."""
    global _http_client
    if _http_client is None:
        _http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0),
            limits=httpx.Limits(max_connections=100, max_keepalive_connections=20)
        )
    return _http_client

async def init_http_client() -> None:
    """Initialize the shared HTTP client pool."""
    global _http_client
    if _http_client is None:
        _http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0),
            limits=httpx.Limits(max_connections=100, max_keepalive_connections=20)
        )

async def close_http_client() -> None:
    """Close the shared HTTP client pool."""
    global _http_client
    if _http_client is not None:
        await _http_client.aclose()
        _http_client = None
