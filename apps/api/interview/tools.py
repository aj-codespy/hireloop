from google.genai import types

INTERVIEW_TOOLS = [
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="next_question",
                description=(
                    "Advance to the next interview question. Call this when the "
                    "candidate has finished answering, you have asked any brief "
                    "follow-ups you need, or when the server signals that the "
                    "question time limit has been reached."
                ),
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "notes": types.Schema(
                            type=types.Type.STRING,
                            description=(
                                "Brief internal note on answer completeness "
                                "(not spoken to the candidate)."
                            ),
                        ),
                    },
                ),
            ),
            types.FunctionDeclaration(
                name="wrap_up",
                description=(
                    "End the interview with warm closing remarks. Call this after "
                    "all questions are complete, or when instructed that the "
                    "overall interview time limit has been reached."
                ),
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "reason": types.Schema(
                            type=types.Type.STRING,
                            description="Why the interview is ending.",
                            enum=["completed", "time_limit", "other"],
                        ),
                    },
                    required=["reason"],
                ),
            ),
        ]
    )
]
