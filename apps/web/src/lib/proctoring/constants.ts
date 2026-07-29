export const PROCTORING = {
  /** How often to capture frames for AI vision analysis (ms) */
  snapshotIntervalMs: 12_000,
  /** Client-side face check interval (ms) */
  faceCheckIntervalMs: 2_000,
  /** Face must be missing this long before a warning (ms) */
  noFaceGraceMs: 3_000,
  /** Face missing this long escalates to a critical violation (ms) */
  noFaceCriticalMs: 10_000,
  /** Tab hidden this long before violation (ms) */
  tabHiddenGraceMs: 2_000,
  /** Consecutive face detections required during setup */
  setupFaceRequired: 3,
  /** Max warnings before client-side lockout overlay */
  maxWarnings: 15,
  /** Max critical events before lockout */
  maxCritical: 3,
  /** JPEG quality for snapshots sent to server */
  snapshotQuality: 0.55,
  /** Max snapshot width (px) */
  snapshotMaxWidth: 480,
} as const;
