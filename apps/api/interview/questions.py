from dataclasses import dataclass


@dataclass(frozen=True)
class Question:
    id: str
    section: str
    prompt_text: str
    ideal_answer_notes: str
    time_limit_seconds: int
    audio_url: str | None = None
    audio_url_hi: str | None = None


# Demo bank for the spike — mirrors the schema shape without a database.
DEMO_QUESTIONS: list[Question] = [
    Question(
        id="tech-1",
        section="technical",
        prompt_text=(
            "Walk me through how you would reconcile a bank statement "
            "against a general ledger. What steps would you take and what "
            "red flags would you look for?"
        ),
        ideal_answer_notes=(
            "Should mention matching transactions, investigating unmatched items, "
            "timing differences, and escalation for material discrepancies."
        ),
        time_limit_seconds=90,
    ),
    Question(
        id="situational-1",
        section="situational",
        prompt_text=(
            "Tell me about a time you had to meet a tight deadline while "
            "maintaining accuracy. How did you prioritize?"
        ),
        ideal_answer_notes=(
            "STAR format; emphasis on trade-offs, communication, and quality controls."
        ),
        time_limit_seconds=75,
    ),
    Question(
        id="hr-1",
        section="hr",
        prompt_text=(
            "Why are you interested in this role, and what would you hope to "
            "learn in your first six months?"
        ),
        ideal_answer_notes=(
            "Genuine motivation, alignment with finance/accounting career path, "
            "realistic learning goals."
        ),
        time_limit_seconds=60,
    ),
]


def load_demo_questions() -> list[Question]:
    return list(DEMO_QUESTIONS)
