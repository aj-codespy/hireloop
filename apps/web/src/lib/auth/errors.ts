/** Next.js `redirect()` throws a special error — must rethrow in form handlers. */
export function isNextRedirectError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

const FRIENDLY_PATTERNS: Array<{ match: RegExp; message: string }> = [
  {
    match: /invalid_otp|token has expired or is invalid|otp.*invalid|invalid.*otp/i,
    message: "That code isn't valid. Check the email for the latest code and try again.",
  },
  {
    match: /otp_expired|otp.*expired|code.*expired|expired.*code/i,
    message: "That code has expired. Request a new one and try again.",
  },
  {
    match: /rate limit|too many requests|slow down|429/i,
    message: "Too many attempts. Please wait a few minutes and try again.",
  },
  {
    match: /email not confirmed|unconfirmed email|confirm your email/i,
    message: "Your email isn't confirmed yet. Check your inbox for the confirmation link.",
  },
  {
    match: /invalid credentials|invalid login|wrong password|invalid password/i,
    message: "That email or password is incorrect. Please try again.",
  },
  {
    match: /user already registered|already registered|email already/i,
    message: "An account with this email already exists. Sign in instead.",
  },
  {
    match: /user not found|no user found|invalid user/i,
    message: "No account found for this email. Create a profile first.",
  },
];

/** Human-readable copy for auth failures — never surface raw SDK text. */
export function authNetworkErrorMessage(error: unknown): string {
  if (error instanceof TypeError && String(error.message).includes("fetch")) {
    return "Could not reach the authentication service. Check your internet connection and try again.";
  }
  if (error instanceof Error && error.message.includes("ENOTFOUND")) {
    return "Authentication service is unreachable. Verify Supabase URL configuration.";
  }
  if (error instanceof Error) {
    for (const { match, message } of FRIENDLY_PATTERNS) {
      if (match.test(error.message)) return message;
    }
  }
  return "Something went wrong during sign in. Please try again.";
}
