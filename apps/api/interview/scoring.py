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


def _build_prompt(questions: list[Question], entries: list[TranscriptEntry], custom_rules: dict | None = None) -> str:
    q_blocks = []
    for i, q in enumerate(questions, 1):
        q_blocks.append(
            f"Question {i} (id={q.id}):\n"
            f"Prompt: {q.prompt_text}\n"
            f"Ideal answer notes: {q.ideal_answer_notes or 'N/A'}"
        )
    questions_text = "\n\n".join(q_blocks)
    transcript = _format_transcript(entries)

    custom_section = ""
    if custom_rules:
        custom_section = "\n\nCUSTOM SCORING RULES (APPLY THESE IN ADDITION TO BASE RUBRIC):\n"
        if custom_rules.get("weights"):
            custom_section += f"Section Weights: {json.dumps(custom_rules['weights'])}\n"
        if custom_rules.get("keywords"):
            kw = custom_rules["keywords"]
            if kw.get("required"):
                custom_section += f"REQUIRED KEYWORDS (candidate MUST mention): {', '.join(kw['required'])}\n"
            if kw.get("bonus"):
                custom_section += f"BONUS KEYWORDS (adds points): {', '.join(kw['bonus'])}\n"
            if kw.get("penalty"):
                custom_section += f"PENALTY KEYWORDS (deducts points): {', '.join(kw['penalty'])}\n"
        if custom_rules.get("rubric_overrides"):
            custom_section += f"RUBRIC OVERRIDES: {json.dumps(custom_rules['rubric_overrides'])}\n"
        custom_section += "Apply these rules when calculating scores. Note deviations in rationale."

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
Include one entry in questionScores per question listed above.
{custom_section}"""


class ScoringError(RuntimeError):
    """Raised when AI scoring fails or returns unusable data.

    Callers must NOT fall back to a synthetic 0.0 score on this error — a
    failed score is distinct from a genuine low score and must be surfaced
    (and the interview flagged for manual review), not silently recorded.
    """


def _validate_result(data: dict[str, Any], questions: list[Question]) -> None:
    overall = data.get("overallScore") or {}
    if "totalScore" not in overall:
        raise ScoringError("AI scoring response missing overallScore.totalScore")
    try:
        float(overall["totalScore"])
    except (TypeError, ValueError) as exc:
        raise ScoringError(f"AI scoring totalScore is not numeric: {overall.get('totalScore')!r}") from exc

    scores = data.get("questionScores") or []
    if not scores:
        raise ScoringError("AI scoring returned zero questionScores")
    qids = {q.id for q in questions}
    for s in scores:
        if s.get("questionId") not in qids:
            raise ScoringError(f"AI scoring references unknown questionId: {s.get('questionId')!r}")
        try:
            float(s.get("score"))
        except (TypeError, ValueError) as exc:
            raise ScoringError(f"AI scoring score is not numeric: {s.get('score')!r}") from exc


def score_interview(
    questions: list[Question],
    entries: list[TranscriptEntry],
    passing_score: float | None,
    custom_rules: dict | None = None,
) -> dict[str, Any]:
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not set")

    client = genai.Client(api_key=GEMINI_API_KEY)
    prompt = _build_prompt(questions, entries, custom_rules)

    try:
        response = client.models.generate_content(
            model=SCORING_MODEL,
            contents=prompt,
            config={"response_mime_type": "application/json"},
        )
    except Exception as exc:  # noqa: BLE001 - surface as ScoringError, never fake a 0
        raise ScoringError(f"Gemini scoring call failed: {exc}") from exc

    raw = response.text or "{}"
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ScoringError(f"AI scoring returned non-JSON: {raw[:200]!r}") from exc

    if not isinstance(data, dict):
        raise ScoringError(f"AI scoring returned unexpected type: {type(data).__name__}")

    _validate_result(data, questions)

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

