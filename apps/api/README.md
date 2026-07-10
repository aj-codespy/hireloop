# HireLoop — Gemini Live Interview Spike

Minimal proof that the core interview engine works: **browser mic → FastAPI WebSocket relay → Gemini Live → speaker out**, with **function-calling question sequencing** and **server-side timers**.

## What this proves

| Risk | How it's handled |
|---|---|
| WebSocket relay timing | Bidirectional PCM audio (16 kHz in, 24 kHz out) via `/ws/interview` |
| Question sequencing | `next_question()` / `wrap_up()` tools; server returns next question payload |
| Server-side timers | Background task enforces per-question + overall limits; injects `[SYSTEM]` prompts to Gemini |

## Quick start

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Add your GEMINI_API_KEY to .env
uvicorn main:app --reload --port 8000
```

Open [http://localhost:8000](http://localhost:8000), allow microphone access, click **Start interview**.

## Project layout

```
apps/api/
├── main.py                 # FastAPI app + /ws/interview endpoint
├── gemini_live.py          # Gemini Live SDK wrapper
├── config.py
├── interview/
│   ├── relay.py            # Orchestrates session, timers, tools, Gemini
│   ├── session.py          # Interview state machine
│   ├── questions.py        # Demo question bank (3 questions)
│   ├── tools.py            # Function declarations for Live API
│   └── prompts.py          # System + timer injection prompts
└── frontend/               # Vanilla test UI (no build step)
```

## WebSocket protocol (spike)

**Client → server**
- Binary frames: PCM audio (`Int16`, 16 kHz mono)
- JSON `{ "type": "stop" }` — candidate ends early

**Server → client**
- Binary frames: Gemini audio output (24 kHz PCM)
- JSON events: `session_started`, `question_changed`, `timer`, `transcript`, `tool_call`, `session_ended`, `error`

## Demo question bank

Three questions with short timers (90s / 75s / 60s) to make timer behavior easy to observe. Override overall cap via `INTERVIEW_OVERALL_LIMIT_SECONDS` in `.env` (default 600s).

## Model note

Default model is `gemini-2.5-flash-live-preview`. To try Gemini 3.1 Live instead:

```
MODEL=gemini-3.1-flash-live-preview
```

Gemini 3.1 Live currently supports **synchronous only** function calling — fine for this flow since `next_question` must complete before the model continues.

## Success criteria checklist

- [ ] Hear AI greeting and first question within ~5s of starting
- [ ] Answer naturally; AI asks at most one follow-up, then advances
- [ ] `tool_call` events appear in UI when questions advance
- [ ] Question timer hits 0 → AI acknowledges and moves on without you clicking anything
- [ ] All 3 questions complete → warm closing + `wrap_up` tool call
- [ ] Transcripts stream in real time (candidate + AI)

## Known spike limitations (intentional)

- No Supabase, auth, or token gating
- Questions are hardcoded, not from DB
- No reconnect/resume policy yet
- No proctoring, scoring, or recording to R2
- Session ends on Gemini `GoAway` (~10 min connection limit) without resumption

## Next step after spike passes

Wire this relay into the full stack: `interview_sessions` table for state persistence, token-gated `/candidate/:token` route, then post-interview Flash scoring on stored transcripts.
