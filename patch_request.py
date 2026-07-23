with open("apps/api/interview/supabase_store.py", "r") as f:
    content = f.read()

old_req = """
    async def _request(
        self,
        method: str,
        path: str,
        *,
        params: dict | None = None,
        json: Any = None,
        prefer: str | None = None,
    ) -> Any:
        headers = dict(self._headers)
        if prefer:
            headers["Prefer"] = prefer
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.request(
                method,
                f"{self._base}/{path}",
                headers=headers,
                params=params,
                json=json,
            )
            if res.status_code >= 400:
                logger.warning("Supabase error: %s", res.text)
                res.raise_for_status()
            if res.status_code == 204:
                return None
            return res.json()
"""

new_req = """
    async def _request(
        self,
        method: str,
        path: str,
        *,
        params: dict | None = None,
        json: Any = None,
        prefer: str | None = None,
    ) -> Any:
        headers = dict(self._headers)
        if prefer:
            headers["Prefer"] = prefer
            
        import asyncio
        max_retries = 3
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            for attempt in range(max_retries):
                try:
                    res = await client.request(
                        method,
                        f"{self._base}/{path}",
                        headers=headers,
                        params=params,
                        json=json,
                    )
                    if res.status_code >= 400:
                        logger.warning("Supabase error (attempt %d): %s", attempt + 1, res.text)
                        if res.status_code >= 500 and attempt < max_retries - 1:
                            await asyncio.sleep(1.0 * (attempt + 1))
                            continue
                        res.raise_for_status()
                    if res.status_code == 204:
                        return None
                    return res.json()
                except httpx.RequestError as exc:
                    logger.warning("Supabase request error (attempt %d): %s", attempt + 1, exc)
                    if attempt < max_retries - 1:
                        await asyncio.sleep(1.0 * (attempt + 1))
                        continue
                    raise
"""

content = content.replace(old_req.strip(), new_req.strip())

with open("apps/api/interview/supabase_store.py", "w") as f:
    f.write(content)
