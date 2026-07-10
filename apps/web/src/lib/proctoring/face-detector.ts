"use client";

/**
 * Real in-browser proctoring vision backed by MediaPipe:
 * - BlazeFace for face presence/count
 * - EfficientDet-Lite0 for prohibited objects (cell phones)
 * Models load lazily and run locally — no network calls per frame.
 * Falls back to the native FaceDetector API where MediaPipe fails to load.
 */

import type {
  FaceDetector as MpFaceDetector,
  ObjectDetector as MpObjectDetector,
} from "@mediapipe/tasks-vision";

const WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const FACE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";
const OBJECT_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite";

/** COCO categories treated as prohibited during an interview.
 * Deliberately narrow to avoid false flags (e.g. the candidate's own laptop
 * webcam never sees the laptop itself; background TVs are handled by the
 * extended-display check). */
const PROHIBITED_OBJECTS = new Set(["cell phone", "book"]);
const PHONE_MIN_SCORE = 0.4;
const OTHER_MIN_SCORE = 0.6;

let faceDetectorPromise: Promise<MpFaceDetector | null> | null = null;
let objectDetectorPromise: Promise<MpObjectDetector | null> | null = null;

async function loadFaceDetector(): Promise<MpFaceDetector | null> {
  try {
    const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");
    const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
    for (const delegate of ["GPU", "CPU"] as const) {
      try {
        return await FaceDetector.createFromOptions(vision, {
          baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.5,
        });
      } catch (err) {
        console.warn(`Face detector ${delegate} init failed`, err);
      }
    }
  } catch (err) {
    console.warn("MediaPipe face detector unavailable, using fallback", err);
  }
  return null;
}

async function loadObjectDetector(): Promise<MpObjectDetector | null> {
  try {
    const { ObjectDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");
    const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
    for (const delegate of ["GPU", "CPU"] as const) {
      try {
        return await ObjectDetector.createFromOptions(vision, {
          baseOptions: { modelAssetPath: OBJECT_MODEL_URL, delegate },
          runningMode: "VIDEO",
          scoreThreshold: 0.4,
          maxResults: 8,
        });
      } catch (err) {
        console.warn(`Object detector ${delegate} init failed`, err);
      }
    }
  } catch (err) {
    console.warn("MediaPipe object detector unavailable", err);
  }
  return null;
}

export function warmUpFaceDetector(): void {
  if (!faceDetectorPromise) faceDetectorPromise = loadFaceDetector();
  if (!objectDetectorPromise) objectDetectorPromise = loadObjectDetector();
}

/**
 * Count faces visible in the video frame.
 * Returns null when no detector could be initialized (caller should fall back).
 */
export async function detectFaceCount(video: HTMLVideoElement): Promise<number | null> {
  if (video.videoWidth === 0 || video.videoHeight === 0) return null;
  if (!faceDetectorPromise) faceDetectorPromise = loadFaceDetector();
  const detector = await faceDetectorPromise;
  if (!detector) return null;

  try {
    return detector.detectForVideo(video, performance.now()).detections.length;
  } catch (err) {
    console.warn("Face detection frame failed", err);
    return null;
  }
}

/**
 * Detect prohibited objects (phones etc.) in the frame.
 * Returns detected category names, or null when the detector is unavailable.
 */
export async function detectProhibitedObjects(
  video: HTMLVideoElement
): Promise<string[] | null> {
  if (video.videoWidth === 0 || video.videoHeight === 0) return null;
  if (!objectDetectorPromise) objectDetectorPromise = loadObjectDetector();
  const detector = await objectDetectorPromise;
  if (!detector) return null;

  try {
    const result = detector.detectForVideo(video, performance.now());
    const found = new Set<string>();
    for (const det of result.detections) {
      const cat = det.categories[0];
      if (!cat?.categoryName) continue;
      const name = cat.categoryName.toLowerCase();
      if (!PROHIBITED_OBJECTS.has(name)) continue;
      const minScore = name === "cell phone" ? PHONE_MIN_SCORE : OTHER_MIN_SCORE;
      if ((cat.score ?? 0) >= minScore) found.add(name);
    }
    return [...found];
  } catch (err) {
    console.warn("Object detection frame failed", err);
    return null;
  }
}
