from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum

from interview.questions import Question


class SessionStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    TIMED_OUT = "timed_out"
    ABANDONED = "abandoned"
    FLAGGED = "flagged"


@dataclass
class TranscriptEntry:
    speaker: str
    text: str
    timestamp_offset_seconds: float
    question_id: str | None = None


@dataclass
class InterviewSession:
    questions: list[Question]
    overall_limit_seconds: int
    current_index: int = 0
    status: SessionStatus = SessionStatus.PENDING
    started_at: datetime | None = None
    question_started_at: datetime | None = None
    ended_at: datetime | None = None
    transcripts: list[TranscriptEntry] = field(default_factory=list)
    _question_timer_forced: bool = False
    _overall_timer_forced: bool = False
    _paused_at: datetime | None = None

    def start(self) -> None:
        now = datetime.now(timezone.utc)
        self.started_at = now
        self.question_started_at = now
        self.status = SessionStatus.IN_PROGRESS

    def _effective_now(self) -> datetime:
        return self._paused_at or datetime.now(timezone.utc)

    def pause_clocks(self) -> None:
        """Freeze both timers (e.g. while transcribing) so processing time is not charged."""
        if self._paused_at is None:
            self._paused_at = datetime.now(timezone.utc)

    def resume_clocks(self) -> None:
        if self._paused_at is None:
            return
        delta = datetime.now(timezone.utc) - self._paused_at
        if self.started_at:
            self.started_at += delta
        if self.question_started_at:
            self.question_started_at += delta
        self._paused_at = None

    @property
    def current_question(self) -> Question | None:
        if 0 <= self.current_index < len(self.questions):
            return self.questions[self.current_index]
        return None

    @property
    def elapsed_seconds(self) -> float:
        if not self.started_at:
            return 0.0
        end = self.ended_at or self._effective_now()
        return (end - self.started_at).total_seconds()

    def question_remaining_seconds(self) -> float:
        question = self.current_question
        if not question or not self.question_started_at:
            return 0.0
        elapsed = (self._effective_now() - self.question_started_at).total_seconds()
        return max(0.0, question.time_limit_seconds - elapsed)

    def overall_remaining_seconds(self) -> float:
        if not self.started_at:
            return float(self.overall_limit_seconds)
        elapsed = (self._effective_now() - self.started_at).total_seconds()
        return max(0.0, self.overall_limit_seconds - elapsed)

    def add_transcript(
        self,
        speaker: str,
        text: str,
        question_id: str | None = None,
    ) -> TranscriptEntry:
        entry = TranscriptEntry(
            speaker=speaker,
            text=text,
            timestamp_offset_seconds=self.elapsed_seconds,
            question_id=question_id or (self.current_question.id if self.current_question else None),
        )
        self.transcripts.append(entry)
        return entry

    def current_question_payload(self, *, language: str = "en") -> dict:
        question = self.current_question
        if not question:
            raise RuntimeError("No current question")
        audio_url = question.audio_url_hi if language == "hi" else question.audio_url
        payload = {
            "index": self.current_index,
            "question_id": question.id,
            "section": question.section,
            "prompt": question.prompt_text,
            "ideal_answer_notes": question.ideal_answer_notes,
            "time_limit_seconds": question.time_limit_seconds,
        }
        if audio_url:
            payload["audio_url"] = audio_url
        return payload

    def advance_after_current(self) -> dict:
        self.current_index += 1
        self.question_started_at = datetime.now(timezone.utc)
        self._question_timer_forced = False

        if self.current_index >= len(self.questions):
            return {
                "done": True,
                "message": "All questions completed.",
                "questions_answered": len(self.questions),
            }

        return {"done": False, **self.current_question_payload()}

    def finish(self, status: SessionStatus) -> dict:
        self.status = status
        self.ended_at = datetime.now(timezone.utc)
        return {
            "status": status.value,
            "elapsed_seconds": round(self.elapsed_seconds, 1),
            "questions_answered": min(self.current_index + 1, len(self.questions)),
        }

    def mark_question_timer_forced(self) -> bool:
        if self._question_timer_forced:
            return False
        self._question_timer_forced = True
        return True

    def mark_overall_timer_forced(self) -> bool:
        if self._overall_timer_forced:
            return False
        self._overall_timer_forced = True
        return True

    def is_active(self) -> bool:
        return self.status == SessionStatus.IN_PROGRESS
