# Handoff Report — Backend Codebase Audit (HTTPX Client and Transcription Indexing)

This report details the read-only audit of the `apps/api` codebase regarding `httpx.AsyncClient` usage and background transcription saving issues.

---

## 1. Observation

### Issue 1: `httpx.AsyncClient` Instantiations
We observed **six** instances of inline `httpx.AsyncClient` instantiation across the following paths:

1. **`apps/api/interview/answer_upload.py`**:
   - Line 43:
     ```python
     async with httpx.AsyncClient(timeout=60.0) as client:
         res = await client.post(upload_url, headers=headers, content=data)
     ```
   - Line 56:
     ```python
     async with httpx.AsyncClient(timeout=60.0) as client:
         res = await client.get(url, headers=headers)
     ```

2. **`apps/api/interview/email_notify.py`**:
   - Line 43:
     ```python
     async with httpx.AsyncClient(timeout=30.0) as client:
         response = await client.post("https://api.resend.com/emails", ...)
     ```

3. **`apps/api/interview/question_audio.py`**:
   - Line 35:
     ```python
     async with httpx.AsyncClient(timeout=60.0) as client:
         res = await client.post(upload_url, headers=headers, content=audio_bytes)
     ```

4. **`apps/api/interview/supabase_store.py`**:
   - Line 58 (inside `_request`):
     ```python
     async with httpx.AsyncClient(timeout=30.0) as client:
         res = await client.request(method, f"{self._base}/{path}", ...)
     ```
   - Line 532:
     ```python
     async with httpx.AsyncClient(timeout=30.0) as client:
         res = await client.post(upload_url, headers=headers, content=image_bytes)
     ```

---

### Issue 2: Background Transcription Saves and Stale Index Tracking
We observed the following relevant code patterns in **`apps/api/interview/structured_relay.py`**:

- **Concurrent Background Tasks Scheduled Without Synchronization**:
  - Line 402–406:
    ```python
    task = asyncio.create_task(
        self._transcribe_in_background(entry, audio_bytes, mime_type, q.id, index)
    )
    self._transcribe_tasks.add(task)
    task.add_done_callback(self._transcribe_tasks.discard)
    ```
  - Line 509 (inside `_advance_locked`):
    ```python
    self.create_background_task(_save_skipped())
    ```
  - Line 542 (inside `_advance_locked`):
    ```python
    self.create_background_task(_save_index())
    ```

- **Generic Save Method Overwriting Index**:
  - Line 452–457 (inside `_transcribe_in_background`):
    ```python
    await self.store.save_question_answer(
        self.db_session_id,
        current_index=self.session.current_index,
        entries=self.session.transcripts,
        question_started_at=self.session.question_started_at,
    )
    ```
  - The `save_question_answer` implementation in `apps/api/interview/supabase_store.py` (Line 386–406) always patches both `transcript` and `current_question_index`:
    ```python
    payload: dict[str, Any] = {
        "transcript": self._transcript_to_json(entries),
        "current_question_index": current_index,
    }
    ```

- **Delayed Evaluation of Mutable State inside Background Tasks**:
  - In `_save_skipped()` (Line 499–506):
    ```python
    async def _save_skipped():
        try:
            await self.store.save_question_answer(
                self.db_session_id,
                current_index=self.session.current_index,
                entries=self.session.transcripts,
                question_started_at=self.session.question_started_at,
            )
    ```
    This task is scheduled, but before it runs, the event loop yields and synchronously executes:
    ```python
    self.session.current_index += 1
    self.session.question_started_at = datetime.now(timezone.utc)
    ```
    Consequently, `_save_skipped` reads the advanced index/started_at rather than the values active when the skip occurred.

---

## 2. Logic Chain

### Issue 1: Connection Exhaustion
1. Creating a new `httpx.AsyncClient` inside every API or storage call creates a new connection pool instance.
2. When the request completes, the pool is closed.
3. This completely bypasses HTTP connection reuse (keep-alive) and forces a new TCP handshake and SSL/TLS negotiation on every request.
4. Under high concurrent load, this leads to socket resource exhaustion, high request latency, and connection failures.
5. Establishing a shared, lifecycle-managed client pool avoids this exhaustion by reusing a fixed number of warm connections.

### Issue 2: Data Corruption and Index Regression
1. In `StructuredInterviewRelay`, multiple operations write to the database in the background via asynchronous tasks (`_transcribe_in_background`, `_save_index`, `_save_skipped`).
2. These tasks call Supabase PATCH requests, which run concurrently. Since HTTP response order is subject to network jitter, a PATCH request from an earlier question (e.g. Q0) can complete *after* a PATCH request from a later question (e.g. Q1).
3. The transcription save task calls the generic `save_question_answer` method which updates `current_question_index` in the database.
4. If a transcription task for an older question finishes late, its PATCH request updates the database's `current_question_index` using the memory state at the moment of completion. If the user disconnects and reconnects while a late PATCH is in-flight or reordered, they can get rolled back to a previous question.
5. Even worse, the `transcript` JSON array is written in its entirety on each PATCH. If T0 (which has Q0 text and Q1 as placeholder) finishes and writes to the DB *after* T1 (which has Q0 placeholder and Q1 text) has already written to the DB, T0 will overwrite the database and erase Q1's text, resetting it back to a placeholder. This causes out-of-order data corruption.
6. The `_save_skipped` function is scheduled as a background task, but evaluates `self.session.current_index` and `self.session.question_started_at` after they have been advanced synchronously, leading to incorrect database state logging.

---

## 3. Caveats
- We did not audit the frontend chunk generation or upload retry behavior.
- We assume that only one websocket connection is active per interview session at a time (which is the designed standard). If multiple websocket sessions run concurrently for the same session ID, database-level locking or optimistic concurrency control would be needed in addition to memory locks.

---

## 4. Conclusion

- **Connection Pool**: Establishing a shared `httpx.AsyncClient` instantiated at app startup and managed via a FastAPI lifespan context manager will resolve connection exhaustion and improve performance.
- **Out-of-Order Corruption & Stale Indexing**:
  - We must serialize database writes per websocket relay session to guarantee they execute in the order they complete/start.
  - Background transcription tasks must only update the `transcript` column and should never write to or modify `current_question_index` or `question_started_at`.
  - State variables (`current_index`, `question_started_at`) must be captured at the moment background tasks are scheduled rather than evaluated dynamically when they run on the event loop.

---

## 5. Verification Method

### Phase 1: Verify the Proposed Code Structure
1. Check that a shared HTTP pool utility is established (e.g. `utils/http_pool.py`).
2. Inspect `apps/api/main.py` to ensure it uses the `lifespan` argument in `FastAPI(...)` to init/close the pool.
3. Verify that the files listed in Observation 1 import `get_http_client` and call methods on it directly (e.g., `client.post(...)`) without wrapping calls in `async with`.

### Phase 2: Verify Index and Serialization Fixes
1. Inspect `StructuredInterviewRelay` in `apps/api/interview/structured_relay.py` to verify:
   - A dedicated lock `self._db_lock = asyncio.Lock()` is acquired around all DB write calls.
   - All background database save closures (`_save_index`, `_save_skipped`) capture their index and timestamp variables immediately (e.g. `idx = self.session.current_index`).
   - Transcription background saves call a specialized `save_transcript_only` method instead of `save_question_answer`.
2. Inspect `SupabaseInterviewStore` in `apps/api/interview/supabase_store.py` to verify the presence of `save_transcript_only` which only includes the `transcript` key in the PATCH payload.

### Phase 3: Automated Test Execution
Run the end-to-end test script to ensure all API flows remain intact:
```bash
pytest apps/api/scripts/test_interview_e2e.py
```
Ensure that no errors or timeouts occur during chunk uploads or WebSocket event transitions.

---

## Step-by-Step Fix Strategy

### Step 1: Implement HTTP connection pool utility
Create `apps/api/utils/http_pool.py` with:
```python
import httpx
from typing import Optional

_client: Optional[httpx.AsyncClient] = None

def get_http_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(timeout=30.0)
    return _client

async def init_http_client() -> None:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0, read=60.0),
            limits=httpx.Limits(max_keepalive_connections=50, max_connections=100)
        )

async def close_http_client() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None
```

### Step 2: Bind lifespan in `main.py`
Modify `apps/api/main.py` to define and register the lifespan:
```python
from contextlib import asynccontextmanager
from utils.http_pool import init_http_client, close_http_client

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_http_client()
    yield
    await close_http_client()

app = FastAPI(title="HireLoop Interview API", version="0.3.0", lifespan=lifespan)
```

### Step 3: Update client usages
In `answer_upload.py`, `email_notify.py`, `question_audio.py`, and `supabase_store.py`:
- Import `get_http_client` from `utils.http_pool`.
- Replace `async with httpx.AsyncClient(...) as client:` blocks with:
  ```python
  client = get_http_client()
  # call client.get / client.post directly without async with
  ```

### Step 4: Add `save_transcript_only` in `supabase_store.py`
Add the following method to `SupabaseInterviewStore`:
```python
async def save_transcript_only(self, session_id: str, entries: list[TranscriptEntry]) -> None:
    payload = {"transcript": self._transcript_to_json(entries)}
    await self._request(
        "PATCH",
        "interview_sessions",
        params={"id": f"eq.{session_id}"},
        json=payload,
        prefer="return=minimal",
    )
```

### Step 5: Implement Serialization and Variable Capturing in `structured_relay.py`
1. Initialize `self._db_lock = asyncio.Lock()` in `StructuredInterviewRelay.__init__`.
2. Update `_transcribe_in_background` to acquire the lock and call `save_transcript_only`:
   ```python
   entry.text = text
   if self.store and self.db_session_id:
       try:
           async with self._db_lock:
               await self.store.save_transcript_only(
                   self.db_session_id,
                   entries=self.session.transcripts,
               )
       except Exception as exc:
           logger.error("Failed to persist answer transcript: %s", exc, exc_info=True)
   ```
3. Update `_advance_locked` background task helpers to capture state variables and acquire the DB lock:
   ```python
   # Inside _advance_locked:
   q = self.session.current_question
   if q and not self._current_answer_saved():
       self.session.add_transcript("candidate", "", question_id=q.id)
       if self.store and self.db_session_id:
           # Capture values immediately
           idx_to_save = self.session.current_index
           start_to_save = self.session.question_started_at
           
           async def _save_skipped():
               try:
                   async with self._db_lock:
                       await self.store.save_question_answer(
                           self.db_session_id,
                           current_index=idx_to_save,
                           entries=self.session.transcripts,
                           question_started_at=start_to_save,
                       )
               except Exception as exc:
                   logger.error("Failed to persist skipped answer: %s", exc, exc_info=True)
           self.create_background_task(_save_skipped())
           
   self.session.current_index += 1
   self.session.question_started_at = datetime.now(timezone.utc)
   ...
   if self.store and self.db_session_id:
       # Capture values immediately after increment
       new_idx_to_save = self.session.current_index
       new_start_to_save = self.session.question_started_at
       
       async def _save_index():
           try:
               async with self._db_lock:
                   await self.store.save_question_answer(
                       self.db_session_id,
                       current_index=new_idx_to_save,
                       entries=self.session.transcripts,
                       question_started_at=new_start_to_save,
                   )
           except Exception as exc:
               logger.error("Failed to persist question index: %s", exc, exc_info=True)
       self.create_background_task(_save_index())
   ```
