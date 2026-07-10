export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
}

export function validateOtpCode(code: string): string | null {
  const trimmed = code.trim();
  if (!/^\d{6,8}$/.test(trimmed)) return "Enter the 6-digit code from your email.";
  return null;
}
