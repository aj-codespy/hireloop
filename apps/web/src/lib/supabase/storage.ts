import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApplicationDocument } from "@/lib/types";

export const APPLICATION_FILES_BUCKET = "application-files";
export const PROCTORING_SNAPSHOTS_BUCKET = "proctoring-snapshots";
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".csv",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".rtf",
  ".odt",
  ".ods",
]);

function fileExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}

export function isAllowedDocument(file: File): boolean {
  if (file.size <= 0 || file.size > MAX_DOCUMENT_BYTES) return false;
  const ext = fileExtension(file.name);
  if (ALLOWED_EXTENSIONS.has(ext)) return true;
  if (file.type.startsWith("application/")) return true;
  if (file.type.startsWith("image/")) return true;
  if (file.type.startsWith("text/")) return true;
  return ext === "";
}

export function buildApplicationDocumentPath(
  orgId: string,
  jobId: string,
  applicationId: string,
  fieldKey: string,
  originalName: string
): string {
  const ext = fileExtension(originalName) || ".bin";
  const safeKey = fieldKey.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${orgId}/${jobId}/${applicationId}/${safeKey}${ext}`;
}

export async function uploadApplicationDocument(
  supabase: SupabaseClient,
  input: {
    orgId: string;
    jobId: string;
    applicationId: string;
    fieldKey: string;
    file: File;
  }
): Promise<ApplicationDocument> {
  if (!isAllowedDocument(input.file)) {
    throw new Error(
      `Invalid document "${input.file.name}". Max ${MAX_DOCUMENT_BYTES / (1024 * 1024)}MB; PDF, Word, Excel, images, and text files are supported.`
    );
  }

  const storagePath = buildApplicationDocumentPath(
    input.orgId,
    input.jobId,
    input.applicationId,
    input.fieldKey,
    input.file.name
  );

  const buffer = Buffer.from(await input.file.arrayBuffer());
  const { error } = await supabase.storage.from(APPLICATION_FILES_BUCKET).upload(storagePath, buffer, {
    contentType: input.file.type || "application/octet-stream",
    upsert: true,
  });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  return {
    originalName: input.file.name,
    storagePath,
    mimeType: input.file.type || "application/octet-stream",
    sizeBytes: input.file.size,
  };
}

export async function createApplicationDocumentSignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresInSeconds = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(APPLICATION_FILES_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "Could not create download link");
  }

  return data.signedUrl;
}

export async function createProctoringSnapshotSignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresInSeconds = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(PROCTORING_SNAPSHOTS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "Could not create snapshot link");
  }

  return data.signedUrl;
}
