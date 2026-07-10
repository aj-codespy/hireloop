const statusEl = document.getElementById("status");
const orbEl = document.getElementById("orb");
const questionTimerEl = document.getElementById("question-timer");
const overallTimerEl = document.getElementById("overall-timer");
const questionMetaEl = document.getElementById("question-meta");
const questionTextEl = document.getElementById("question-text");
const transcriptEl = document.getElementById("transcript");
const debugLogEl = document.getElementById("debug-log");
const startBtn = document.getElementById("start-btn");
const stopBtn = document.getElementById("stop-btn");

const media = new MediaHandler();
let socket = null;
let aiSpeaking = false;

function log(line) {
  const stamp = new Date().toLocaleTimeString();
  debugLogEl.textContent = `[${stamp}] ${line}\n` + debugLogEl.textContent.slice(0, 4000);
}

function formatSeconds(total) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function setStatus(text, klass = "") {
  statusEl.textContent = text;
  statusEl.className = `status-pill ${klass}`.trim();
}

function addTranscript(speaker, text) {
  const line = document.createElement("div");
  line.className = `line ${speaker === "ai" ? "ai" : speaker === "candidate" ? "candidate" : "system"}`;
  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = speaker;
  const body = document.createElement("div");
  body.textContent = text;
  line.append(meta, body);
  transcriptEl.appendChild(line);
  transcriptEl.scrollTop = transcriptEl.scrollHeight;
}

function setOrb(mode) {
  orbEl.className = "orb";
  if (mode === "speaking") orbEl.classList.add("speaking");
  if (mode === "listening") orbEl.classList.add("listening");
}

function wsUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/interview`;
}

function handleEvent(event) {
  if (event.data instanceof ArrayBuffer) {
    aiSpeaking = true;
    setOrb("speaking");
    media.playAudio(event.data);
    return;
  }

  let payload;
  try {
    payload = JSON.parse(event.data);
  } catch (_) {
    return;
  }

  switch (payload.type) {
    case "session_started":
      setStatus("Live", "live");
      log(`Session started — ${payload.question_count} questions`);
      overallTimerEl.textContent = formatSeconds(payload.overall_limit_seconds);
      break;

    case "question_changed":
      questionMetaEl.textContent = `Question ${payload.index + 1} · ${payload.section}`;
      questionTextEl.textContent = payload.prompt;
      questionTimerEl.textContent = formatSeconds(payload.time_limit_seconds);
      log(`Question changed → ${payload.question_id}`);
      break;

    case "timer":
      questionTimerEl.textContent = formatSeconds(payload.question_remaining_seconds);
      overallTimerEl.textContent = formatSeconds(payload.overall_remaining_seconds);
      break;

    case "transcript":
      addTranscript(payload.speaker, payload.text);
      if (payload.speaker === "ai") {
        aiSpeaking = true;
        setOrb("speaking");
      } else {
        setOrb("listening");
      }
      break;

    case "tool_call":
      log(`Tool: ${payload.name}(${JSON.stringify(payload.args)})`);
      addTranscript("system", `${payload.name} → ${JSON.stringify(payload.result)}`);
      break;

    case "turn_complete":
      aiSpeaking = false;
      setOrb("listening");
      break;

    case "interrupted":
      media.stopAudioPlayback();
      aiSpeaking = false;
      setOrb("listening");
      log("AI interrupted (barge-in)");
      break;

    case "wrap_up":
    case "session_ended":
      setStatus("Ended", "ended");
      setOrb("");
      startBtn.disabled = false;
      stopBtn.disabled = true;
      media.stopAudio();
      log(`Session ended — ${payload.status || "closed"}`);
      break;

    case "error":
      setStatus("Error");
      log(`ERROR: ${payload.message}`);
      addTranscript("system", payload.message);
      startBtn.disabled = false;
      stopBtn.disabled = true;
      media.stopAudio();
      break;

    default:
      log(`Event: ${payload.type}`);
  }
}

async function startInterview() {
  transcriptEl.innerHTML = "";
  startBtn.disabled = true;
  stopBtn.disabled = false;
  setStatus("Connecting…");

  socket = new WebSocket(wsUrl());
  socket.binaryType = "arraybuffer";

  socket.onopen = async () => {
    log("WebSocket connected");
    try {
      await media.startAudio((pcmBuffer) => {
        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(pcmBuffer);
        }
      });
      setOrb("listening");
    } catch (err) {
      log(`Mic error: ${err.message}`);
      setStatus("Mic denied");
      startBtn.disabled = false;
      stopBtn.disabled = true;
    }
  };

  socket.onmessage = handleEvent;

  socket.onclose = () => {
    log("WebSocket closed");
    media.stopAudio();
    media.stopAudioPlayback();
    startBtn.disabled = false;
    stopBtn.disabled = true;
    if (statusEl.textContent !== "Ended") {
      setStatus("Disconnected");
    }
  };

  socket.onerror = () => {
    log("WebSocket error");
    setStatus("Connection error");
  };
}

function stopInterview() {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "stop" }));
  }
  media.stopAudio();
  media.stopAudioPlayback();
  stopBtn.disabled = true;
}

startBtn.addEventListener("click", startInterview);
stopBtn.addEventListener("click", stopInterview);
