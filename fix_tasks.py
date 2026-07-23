import re

def fix_file():
    path = "apps/api/interview/structured_relay.py"
    with open(path, "r") as f:
        content = f.read()

    # Add _background_tasks to __init__
    if "self._background_tasks = set()" not in content:
        content = content.replace("self._transcribe_tasks = set()", "self._transcribe_tasks = set()\n        self._background_tasks = set()")

    # Add create_background_task method
    if "def create_background_task" not in content:
        method = """
    def create_background_task(self, coro) -> asyncio.Task:
        task = asyncio.create_task(coro)
        self._background_tasks.add(task)
        task.add_done_callback(self._background_tasks.discard)
        return task
"""
        content = content.replace("    async def run(self) -> None:", method + "\n    async def run(self) -> None:")

    # Replace asyncio.create_task with self.create_background_task where appropriate
    content = content.replace("asyncio.create_task(self._handle_proctoring_event(message))", "self.create_background_task(self._handle_proctoring_event(message))")
    content = content.replace("asyncio.create_task(self._handle_proctoring_snapshot(message))", "self.create_background_task(self._handle_proctoring_snapshot(message))")
    content = content.replace("asyncio.create_task(_save_skipped())", "self.create_background_task(_save_skipped())")
    content = content.replace("asyncio.create_task(_save_index())", "self.create_background_task(_save_index())")

    # In handle_client_message, change await self._handle_submit_answer to create_background_task
    content = content.replace("await self._handle_submit_answer(message)", "self.create_background_task(self._handle_submit_answer(message))")
    
    # In run(), await background tasks before returning
    if "await asyncio.gather(*self._background_tasks" not in content:
        content = content.replace("await self._done_event.wait()", "await self._done_event.wait()\n        if self._background_tasks:\n            await asyncio.gather(*self._background_tasks, return_exceptions=True)")

    with open(path, "w") as f:
        f.write(content)

fix_file()
