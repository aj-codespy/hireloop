export function isActionError(res: unknown): res is { ok: false; error: string } {
  return (
    typeof res === "object" &&
    res !== null &&
    "ok" in res &&
    (res as Record<string, unknown>).ok === false &&
    "error" in res &&
    typeof (res as Record<string, unknown>).error === "string"
  );
}
