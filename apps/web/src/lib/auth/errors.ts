/** Next.js `redirect()` throws a special error — must rethrow in form handlers. */
export function isNextRedirectError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

export function authNetworkErrorMessage(error: unknown): string {
  if (error instanceof TypeError && String(error.message).includes("fetch")) {
    return "Could not reach the authentication service. Check your internet connection and try again.";
  }
  if (error instanceof Error && error.message.includes("ENOTFOUND")) {
    return "Authentication service is unreachable. Verify Supabase URL configuration.";
  }
  return "Something went wrong during sign in. Please try again.";
}
