"""Post-interview scoring with Gemini Flash (text, not Live)."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any

from google import genai

from config import GEMINI_API_KEY, SCORING_MODEL
from interview.questions import Question
from interview.session import TranscriptEntry

logger = logging.getLogger(__name__)


def _format_transcript(entries: list[TranscriptEntry]) -> str:
    lines: list[str] = []
    for e in entries:
        label = "Interviewer" if e.speaker == "ai" else "Candidate"
        q = f" [Q:{e.question_id}]" if e.question_id else ""
        lines.append(f"{label}{q}: {e.text}")
    return "\n".join(lines) if lines else "(empty transcript)"


def _build_prompt(questions: list[Question], entries: list[TranscriptEntry]) -> str:
    q_blocks = []
    for i, q in enumerate(questions, 1):
        q_blocks.append(
            f"Question {i} (id={q.id}):\n"
            f"Prompt: {q.prompt_text}\n"
            f"Ideal answer notes: {q.ideal_answer_notes or 'N/A'}"
        )
    questions_text = "\n\n".join(q_blocks)
    transcript = _format_transcript(entries)

    return f"""You are an expert hiring assessor. Score this structured voice interview.

Each question was read to the candidate from a fixed script. Score only the candidate's spoken answers.

INTERVIEW QUESTIONS:
{questions_text}

CANDIDATE ANSWERS (transcript):
{transcript}

If a question has no answer or an empty answer, score it 0 with rationale noting no response.

Return ONLY valid JSON with this exact shape:
{{
  "questionScores": [
    {{
      "questionId": "<id from questions>",
      "promptText": "<question prompt>",
      "score": <number 0-10>,
      "rationale": "<2-3 sentences>",
      "redFlags": ["<optional strings>"]
    }}
  ],
  "overallScore": {{
    "totalScore": <number 0-10, weighted average>,
    "pass": <boolean>,
    "strengths": "<2-3 sentences>",
    "concerns": "<2-3 sentences or empty if none>",
    "generatedAt": "<ISO8601 UTC timestamp>"
  }}
}}

Score fairly based on substance, not eloquence alone. Use the ideal answer notes as rubric guidance.
Include one entry in questionScores per question listed above."""


def score_interview(
    questions: list[Question],
    entries: list[TranscriptEntry],
    passing_score: float | None,
) -> dict[str, Any]:
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not set")

    client = genai.Client(api_key=GEMINI_API_KEY)
    prompt = _build_prompt(questions, entries)

    response = client.models.generate_content(
        model=SCORING_MODEL,
        contents=prompt,
        config={"response_mime_type": "application/json"},
    )

    raw = response.text or "{}"
    data = json.loads(raw)

    overall = data.get("overallScore") or {}
    if passing_score is not None:
        total = float(overall.get("totalScore", 0))
        overall["pass"] = total >= passing_score
    elif "pass" not in overall:
        overall["pass"] = True

    if not overall.get("generatedAt"):
        overall["generatedAt"] = datetime.now(timezone.utc).isoformat()

    return {
        "question_scores": data.get("questionScores") or [],
        "overall_score": overall,
        "passed": bool(overall.get("pass")),
    }
