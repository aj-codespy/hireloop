export type ProctoringSeverity = "info" | "warning" | "critical";

export type ProctoringEventType =
  | "tab_hidden"
  | "window_blur"
  | "fullscreen_exit"
  | "no_face"
  | "multiple_faces"
  | "face_returned"
  | "clipboard_attempt"
  | "camera_lost"
  | "camera_frozen"
  | "extended_display"
  | "ai_snapshot"
  | "session_start";

export interface ProctoringEvent {
  at: string;
  type: ProctoringEventType | string;
  severity: ProctoringSeverity;
  detail: string;
  questionIndex?: number;
  analysis?: ProctoringAnalysis;
}

export interface ProctoringAnalysis {
  faceVisible?: boolean;
  faceCount?: number;
  phoneVisible?: boolean;
  secondaryDeviceVisible?: boolean;
  notesVisible?: boolean;
  secondPersonVisible?: boolean;
  lookingAway?: boolean;
  suspiciousObjects?: string[];
  riskLevel?: "low" | "medium" | "high";
  explanation?: string;
}

export interface ProctoringSummary {
  flagged?: boolean;
  reason?: string;
  warnings?: number;
  critical?: number;
}

export interface ProctoringStatus {
  facePresent: boolean;
  faceCount: number;
  fullscreen: boolean;
  tabVisible: boolean;
  cameraLive: boolean;
  warningCount: number;
  criticalCount: number;
  flagged: boolean;
  lastAlert: string | null;
}

export interface ProctoringWsAlert {
  type: "proctoring_alert" | "proctoring_flagged";
  event_type?: string;
  severity?: ProctoringSeverity;
  detail?: string;
  reason?: string;
  warning_count?: number;
  critical_count?: number;
  warnings?: number;
  critical?: number;
  analysis?: ProctoringAnalysis;
}
