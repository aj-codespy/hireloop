/** Unlock browser audio playback after an explicit user gesture (mic check / start). */
let audioUnlocked = false;

const SILENT_WAV =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";

export function unlockInterviewAudio(): void {
  if (audioUnlocked || typeof window === "undefined") return;
  const audio = new Audio(SILENT_WAV);
  audio.volume = 0.01;
  void audio
    .play()
    .then(() => {
      audioUnlocked = true;
    })
    .catch(() => undefined);
}

export function isInterviewAudioUnlocked(): boolean {
  return audioUnlocked;
}

export function speakQuestionFallback(text: string, language: "en" | "hi"): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === "hi" ? "hi-IN" : "en-US";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }, 50);
}
