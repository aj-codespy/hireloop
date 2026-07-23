import re

with open("apps/api/interview/scoring.py", "r") as f:
    content = f.read()

robust_json_func = """
def robust_json_loads(text: str) -> dict:
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {}

def score_interview(
"""

content = content.replace("def score_interview(", robust_json_func)

new_scoring = """
    try:
        response = client.models.generate_content(
            model=SCORING_MODEL,
            contents=prompt,
            config={"response_mime_type": "application/json"},
        )
        
        usage = calculate_usage(start_time, response, SCORING_MODEL)

        raw = response.text or "{}"
        data = robust_json_loads(raw)

        overall = data.get("overallScore") or {}
        if passing_score is not None:
            try:
                total = float(overall.get("totalScore", 0))
            except ValueError:
                total = 0.0
            overall["pass"] = total >= passing_score
        elif "pass" not in overall:
            overall["pass"] = True

        if not overall.get("generatedAt"):
            overall["generatedAt"] = datetime.now(timezone.utc).isoformat()

        return {
            "question_scores": data.get("questionScores") or [],
            "overall_score": overall,
            "passed": bool(overall.get("pass")),
        }, usage
    except Exception as exc:
        logger.error("LLM scoring failed completely: %s", exc)
        return {
            "question_scores": [],
            "overall_score": {
                "totalScore": 0,
                "pass": False,
                "concerns": "Failed to generate scores due to AI processing error.",
            },
            "passed": False,
        }, {}
"""

old_scoring = """
    response = client.models.generate_content(
        model=SCORING_MODEL,
        contents=prompt,
        config={"response_mime_type": "application/json"},
    )
    
    usage = calculate_usage(start_time, response, SCORING_MODEL)

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
    }, usage
"""

content = content.replace(old_scoring.strip(), new_scoring.strip())

with open("apps/api/interview/scoring.py", "w") as f:
    f.write(content)
