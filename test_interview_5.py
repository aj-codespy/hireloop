import asyncio
import websockets
import json
import base64
from apps.api.interview.supabase_store import get_store
import uuid

async def synthesize(text):
    from apps.api.interview.tts import synthesize_question
    out = synthesize_question(text)
    return out[0], out[1]

async def main():
    store = get_store()
    
    # 1. Setup Application for cand-test-5
    jobs = await store._request("GET", "job_roles", params={"select": "id,title", "limit": "1"})
    job_id = jobs[0]["id"]
    cand_id = "cand-test-5"
    
    token = str(uuid.uuid4())
    app_id = f"app-{uuid.uuid4()}"
    app_data = {
        "id": app_id,
        "job_role_id": job_id,
        "candidate_id": cand_id,
        "status": "interview_sent",
        "interview_token": token
    }
    await store._request("POST", "applications", params={}, json=app_data)
    print(f"Created application {app_id} with token {token} for {cand_id}")
    
    # 2. Pre-synthesize answers
    print("Synthesizing answers...")
    answers = [
        "I am highly skilled in software engineering. I have 5 years of experience building scalable systems.",
        "When dealing with conflicts, I prefer open communication. I schedule a meeting with the team member to discuss the issue directly and find a compromise.",
        "My greatest achievement was reducing cloud costs by 40% through infrastructure optimization."
    ]
    audio_data = []
    for a in answers:
        aud, mime = await synthesize(a)
        audio_data.append((aud, mime))
    print("Synthesized.")
    
    # 3. Connect to Websocket
    uri = f"ws://localhost:8001/ws/interview?token={token}"
    print(f"Connecting to {uri}")
    
    async with websockets.connect(uri, max_size=None) as ws:
        # We need to send start_interview first!
        await ws.send(json.dumps({"type": "start_interview"}))

        while True:
            try:
                msg_str = await ws.recv()
                msg = json.loads(msg_str)
                # Don't print timer to avoid spam
                if msg.get("type") != "timer":
                    print("RECV FULL:", msg)

                if msg.get("type") == "question_changed":
                    idx = msg.get("index", 0)
                    print(f"Got question {idx}: {msg.get('prompt')}")
                    
                    if idx < len(audio_data):
                        aud, mime = audio_data[idx]
                        b64 = base64.b64encode(aud).decode('utf-8')
                    else:
                        aud, mime = await synthesize("I don't know the answer to this question.")
                        b64 = base64.b64encode(aud).decode('utf-8')
                        
                    print(f"Waiting 2 seconds before answering question {idx}...")
                    await asyncio.sleep(2)
                    print(f"Answering question {idx}...")
                    await ws.send(json.dumps({
                        "type": "submit_answer",
                        "question_index": idx,
                        "audio_base64": b64,
                        "mime_type": mime
                    }))
                    
                elif msg.get("type") == "scoring_complete":
                    print("SCORING COMPLETE:", msg)
                    print(f"Score is {msg.get('total_score')}/10, pass={msg.get('passed')}")
                    break
                    
                elif msg.get("type") == "session_ended":
                    print("SESSION ENDED")
                    break
                    
            except websockets.exceptions.ConnectionClosed:
                print("Connection closed")
                break

asyncio.run(main())
