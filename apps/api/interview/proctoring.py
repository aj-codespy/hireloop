"""AI vision analysis of proctoring webcam snapshots."""

from __future__ import annotations

import json
import logging
import re

from google import genai
from google.genai import types

from config import GEMINI_API_KEY, SCORING_MODEL

logger = logging.getLogger(__name__)

ANALYSIS_PROMPT = """You are a strict exam proctor analyzing a webcam snapshot during a job interview.

Detect cheating risks. Look carefully for:
- Mobile phone, tablet, or second screen visible (especially below the laptop, on desk, or in lap)
- A second person in frame or reflection
- Empty chair or no person visible

Note: The following are ALLOWED and should NOT be flagged as cheating:
- Wired earphones, headphones, or earbuds (these are permitted for communication)
- Looking down occasionally (candidates may read notes, look at a resume, or gather thoughts)
- Writing on a notepad

Respond with JSON only (no markdown):
{
  "faceVisible": boolean,
  "faceCount": number,
  "phoneVisible": boolean,
  "secondaryDeviceVisible": boolean,
  "notesVisible": boolean,
  "secondPersonVisible": boolean,
  "lookingAway": boolean,
  "suspiciousObjects": string[],
  "riskLevel": "low" | "medium" | "high",
  "explanation": string
}"""


def analyze_proctoring_snapshot(image_bytes: bytes, *, mime_type: str = "image/jpeg") -> dict:
    if not GEMINI_API_KEY:
        return {"riskLevel": "low", "explanation": "Proctoring vision unavailable (no API key)"}

    client = genai.Client(api_key=GEMINI_API_KEY)
    response = client.models.generate_content(
        model=SCORING_MODEL,
        contents=[
            types.Content(
                role="user",
                parts=[
                    types.Part(text=ANALYSIS_PROMPT),
                    types.Part(
                        inline_data=types.Blob(mime_type=mime_type, data=image_bytes),
                    ),
                ],
            )
        ],
        config=types.GenerateContentConfig(
            temperature=0.1,
            response_mime_type="application/json",
        ),
    )

    text = (response.text or "").strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
        logger.warning("Proctoring vision returned non-JSON: %s", text[:200])
        return {"riskLevel": "low", "explanation": "Could not parse vision response"}


def severity_from_analysis(analysis: dict) -> str:
    if analysis.get("phoneVisible") or analysis.get("secondaryDeviceVisible"):
        return "critical"
    if analysis.get("secondPersonVisible") or analysis.get("notesVisible"):
        return "critical"
    if analysis.get("riskLevel") == "high":
        return "critical"
    if not analysis.get("faceVisible") or (analysis.get("faceCount") or 0) > 1:
        return "critical"
    if analysis.get("lookingAway") or analysis.get("riskLevel") == "medium":
        return "warning"
    return "info"
