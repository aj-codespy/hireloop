with open("apps/api/interview/structured_relay.py", "r") as f:
    content = f.read()

old_flag = """
    async def _flag_proctoring_session(self, reason: str) -> None:
        if not self.store or not self.db_session_id:
            return
        await self.store.flag_session_proctoring(
            self.db_session_id,
            summary={
                "flagged": True,
                "reason": reason,
                "warnings": self._proctoring_warnings,
                "critical": self._proctoring_critical,
            }
        )
"""

new_flag = """
    async def _flag_proctoring_session(self, reason: str) -> None:
        if not self.store or not self.db_session_id:
            return
        try:
            await self.store.flag_session_proctoring(
                self.db_session_id,
                summary={
                    "flagged": True,
                    "reason": reason,
                    "warnings": self._proctoring_warnings,
                    "critical": self._proctoring_critical,
                }
            )
        except Exception as exc:
            logger.error("Failed to flag session proctoring (db error): %s", exc)
"""

content = content.replace(old_flag.strip(), new_flag.strip())

with open("apps/api/interview/structured_relay.py", "w") as f:
    f.write(content)
