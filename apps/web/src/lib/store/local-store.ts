import type { HireLoopState } from "@/lib/store/provider";
import { seedState } from "@/lib/store/seed";

const STORAGE_KEY = "hireloop-app-state";

export function loadLocalState(): HireLoopState {
  if (typeof window === "undefined") return seedState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    return JSON.parse(raw) as HireLoopState;
  } catch {
    return seedState();
  }
}

export function persistLocalState(state: HireLoopState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
