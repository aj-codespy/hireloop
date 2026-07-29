#!/usr/bin/env python3
"""Ensure interview questions have pre-rendered Gemini TTS audio.

Usage (from apps/api, with .env loaded):
  python scripts/ensure_question_audio.py q-articleship-finance-values
  python scripts/ensure_question_audio.py --all-missing

Call this after any programmatic question seed so interviews never fall back
to browser speechSynthesis.
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

# Load apps/api/.env if present
env_path = ROOT / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())


async def main(question_ids: list[str], all_missing: bool) -> None:
    from interview.question_audio import render_questions_for_job
    from interview.supabase_store import get_store

    store = get_store()
    if not store:
        raise SystemExit("Supabase store not configured (check SUPABASE_URL / SUPABASE_SECRET_KEY)")

    ids = list(question_ids)
    if all_missing:
        rows = await store._request(
            "GET",
            "questions",
            params={
                "is_active": "eq.true",
                "or": "(audio_url.is.null,audio_url_hi.is.null)",
                "select": "id",
                "limit": "500",
            },
        )
        ids = sorted({*(ids), *((r["id"] for r in rows or []))})

    if not ids:
        print("No questions to render.")
        return

    print(f"Rendering TTS for {len(ids)} question(s)…")
    results = await render_questions_for_job(store, ids, langs=("en", "hi"))
    for qid, urls in results.items():
        print(f"  {qid}: {urls}")
    missing = [qid for qid in ids if qid not in results]
    if missing:
        print(f"WARNING: no audio returned for: {missing}")
        raise SystemExit(1)
    print("Done.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("question_ids", nargs="*", help="Question IDs to render")
    parser.add_argument(
        "--all-missing",
        action="store_true",
        help="Also render every active question missing audio_url or audio_url_hi",
    )
    args = parser.parse_args()
    if not args.question_ids and not args.all_missing:
        parser.error("Provide question_ids and/or --all-missing")
    asyncio.run(main(args.question_ids, args.all_missing))
