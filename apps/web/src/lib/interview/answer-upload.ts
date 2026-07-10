import { API_BASE_URL } from "@/lib/config";

const DB_NAME = "hireloop-interview";
const STORE_NAME = "pending-chunks";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function chunkKey(sessionId: string, questionIndex: number, chunkIndex: number) {
  return `${sessionId}:${questionIndex}:${chunkIndex}`;
}

export async function bufferChunkLocally(
  sessionId: string,
  questionIndex: number,
  chunkIndex: number,
  blob: Blob
): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({
      id: chunkKey(sessionId, questionIndex, chunkIndex),
      sessionId,
      questionIndex,
      chunkIndex,
      blob,
      createdAt: Date.now(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function removeBufferedChunk(
  sessionId: string,
  questionIndex: number,
  chunkIndex: number
): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(chunkKey(sessionId, questionIndex, chunkIndex));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function uploadAnswerChunk(
  token: string,
  sessionId: string,
  questionIndex: number,
  chunkIndex: number,
  blob: Blob
): Promise<void> {
  await bufferChunkLocally(sessionId, questionIndex, chunkIndex, blob);

  const res = await fetch(`${API_BASE_URL}/interview/answers/chunk`, {
    method: "POST",
    headers: {
      "Content-Type": "audio/webm",
      "X-Interview-Token": token,
      "X-Session-Id": sessionId,
      "X-Question-Index": String(questionIndex),
      "X-Chunk-Index": String(chunkIndex),
    },
    body: blob,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(detail || `Chunk upload failed (${res.status})`);
  }

  await removeBufferedChunk(sessionId, questionIndex, chunkIndex);
}

export async function retryPendingChunks(token: string): Promise<void> {
  const db = await openDb();
  const pending: Array<{
    id: string;
    sessionId: string;
    questionIndex: number;
    chunkIndex: number;
    blob: Blob;
  }> = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result as never[]);
    req.onerror = () => reject(req.error);
  });
  db.close();

  for (const item of pending) {
    try {
      await uploadAnswerChunk(
        token,
        item.sessionId,
        item.questionIndex,
        item.chunkIndex,
        item.blob
      );
    } catch {
      // Leave in IndexedDB for next retry.
    }
  }
}

export async function fetchSessionState(token: string): Promise<{
  session_id: string;
  current_index: number;
  question_started_at?: string;
} | null> {
  const res = await fetch(
    `${API_BASE_URL}/interview/session/state?token=${encodeURIComponent(token)}`
  );
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json();
}
