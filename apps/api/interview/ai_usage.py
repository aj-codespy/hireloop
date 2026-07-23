def calculate_usage(start_time: float, response: any, model_name: str) -> dict:
    import time
    latency = int((time.time() - start_time) * 1000)
    prompt_tokens = 0
    completion_tokens = 0
    if hasattr(response, "usage_metadata") and response.usage_metadata:
        prompt_tokens = response.usage_metadata.prompt_token_count or 0
        completion_tokens = response.usage_metadata.candidates_token_count or 0
    
    # Generic estimate for Gemini Flash
    # Input: $0.075 / 1M, Output: $0.30 / 1M
    cost = (prompt_tokens / 1000000.0 * 0.075) + (completion_tokens / 1000000.0 * 0.30)
    
    return {
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "latency_ms": latency,
        "total_cost": cost,
        "model": model_name
    }
