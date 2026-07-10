import type { ApplicationDocument, FormFieldType } from "@/lib/types";

/** Field types shown when building application forms. */
export const FORM_FIELD_TYPES: FormFieldType[] = [
  "text",
  "email",
  "phone",
  "number",
  "dropdown",
  "doc",
];

export const FORM_FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  text: "Text",
  email: "Email",
  phone: "Phone",
  number: "Number",
  dropdown: "Dropdown",
  doc: "Document upload",
  file: "Document upload",
};

export function isDocumentFieldType(type: FormFieldType): boolean {
  return type === "doc" || type === "file";
}

export function isApplicationDocument(value: unknown): value is ApplicationDocument {
  if (!value || typeof value !== "object") return false;
  const doc = value as ApplicationDocument;
  return (
    typeof doc.originalName === "string" &&
    typeof doc.storagePath === "string" &&
    typeof doc.mimeType === "string" &&
    typeof doc.sizeBytes === "number"
  );
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const DOCUMENT_FIELD_PRESETS: { label: string; fieldKey: string; type: FormFieldType }[] = [
  { label: "Resume", fieldKey: "resume", type: "doc" },
  { label: "Marksheet", fieldKey: "marksheet", type: "doc" },
  { label: "Cover letter", fieldKey: "cover_letter", type: "doc" },
];
