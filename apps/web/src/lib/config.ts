export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function interviewWsUrl(token?: string, lang?: string) {
  const base = API_BASE_URL.replace(/^http/, "ws");
  const params = new URLSearchParams();
  if (token) params.set("token", token);
  if (lang) params.set("lang", lang);
  const qs = params.toString();
  return qs ? `${base}/ws/interview?${qs}` : `${base}/ws/interview`;
}
