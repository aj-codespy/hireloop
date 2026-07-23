// Typed API client for HireLoop v1 REST API
// All requests go through this module — single point of auth, error handling, base URL.

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  apiKey?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (apiKey) {
    headers["X-API-Key"] = apiKey;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail || res.statusText, body);
  }

  return res.json();
}

// ─── Resource helpers ─────────────────────────────────────────────────────

function orgHeaders(orgId: string) {
  return { "X-Org-Id": orgId };
}

// ─── Exported API object ──────────────────────────────────────────────────

export const api = {
  // ── Jobs ──────────────────────────────────────────────────────────────
  listJobs: (orgId: string, params?: Record<string, string>, apiKey?: string) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<{ data: unknown[]; next_cursor: string | null }>(
      `/v1/jobs${qs}`,
      { headers: orgHeaders(orgId) },
      apiKey,
    );
  },

  getJob: (jobId: string, orgId: string, apiKey?: string) =>
    request<unknown>(`/v1/jobs/${jobId}`, { headers: orgHeaders(orgId) }, apiKey),

  createJob: (job: Record<string, unknown>, orgId: string, apiKey?: string) =>
    request<unknown>("/v1/jobs", {
      method: "POST",
      headers: orgHeaders(orgId),
      body: JSON.stringify(job),
    }, apiKey),

  // ── Applications ──────────────────────────────────────────────────────
  listApplications: (orgId: string, params?: Record<string, string>, apiKey?: string) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<{ data: unknown[]; next_cursor: string | null }>(
      `/v1/applications${qs}`,
      { headers: orgHeaders(orgId) },
      apiKey,
    );
  },

  getApplication: (appId: string, orgId: string, apiKey?: string) =>
    request<unknown>(`/v1/applications/${appId}`, { headers: orgHeaders(orgId) }, apiKey),

  transitionApplication: (appId: string, toStatus: string, reason?: string, orgId?: string, apiKey?: string) =>
    request<unknown>(`/v1/applications/${appId}/transition`, {
      method: "POST",
      headers: orgHeaders(orgId ?? ""),
      body: JSON.stringify({ to_status: toStatus, reason }),
    }, apiKey),

  // ── Scores ────────────────────────────────────────────────────────────
  getApplicationScore: (appId: string, orgId: string, apiKey?: string) =>
    request<unknown>(`/v1/applications/${appId}/score`, { headers: orgHeaders(orgId) }, apiKey),

  // ── Webhooks ──────────────────────────────────────────────────────────
  listWebhooks: (orgId: string, apiKey?: string) =>
    request<{ data: unknown[] }>("/v1/webhooks", { headers: orgHeaders(orgId) }, apiKey),

  createWebhook: (sub: Record<string, unknown>, orgId: string, apiKey?: string) =>
    request<unknown>("/v1/webhooks", {
      method: "POST",
      headers: orgHeaders(orgId),
      body: JSON.stringify(sub),
    }, apiKey),

  deleteWebhook: (webhookId: string, orgId: string, apiKey?: string) =>
    request<{ success: boolean }>(`/v1/webhooks/${webhookId}`, {
      method: "DELETE",
      headers: orgHeaders(orgId),
    }, apiKey),

  // ── API Keys ──────────────────────────────────────────────────────────
  listApiKeys: (orgId: string, apiKey?: string) =>
    request<unknown[]>("/v1/api-keys", { headers: orgHeaders(orgId) }, apiKey),

  createApiKey: (name: string, scopes: string[], orgId: string, apiKey?: string) =>
    request<{ id: string; raw_key: string }>("/v1/api-keys", {
      method: "POST",
      headers: orgHeaders(orgId),
      body: JSON.stringify({ name, scopes }),
    }, apiKey),

  revokeApiKey: (keyId: string, orgId: string, apiKey?: string) =>
    request<{ success: boolean }>(`/v1/api-keys/${keyId}`, {
      method: "DELETE",
      headers: orgHeaders(orgId),
    }, apiKey),

  // ── Stages ────────────────────────────────────────────────────────────
  listJobStages: (jobId: string, orgId: string, apiKey?: string) =>
    request<{ data: unknown[] }>(`/v1/jobs/${jobId}/stages`, { headers: orgHeaders(orgId) }, apiKey),

  // ── Scorecards ────────────────────────────────────────────────────────
  listScorecards: (appId: string, orgId: string, apiKey?: string) =>
    request<{ data: unknown[] }>(`/v1/applications/${appId}/scorecards`, { headers: orgHeaders(orgId) }, apiKey),

  createScorecard: (appId: string, scorecard: Record<string, unknown>, orgId: string, apiKey?: string) =>
    request<unknown>(`/v1/applications/${appId}/scorecards`, {
      method: "POST",
      headers: orgHeaders(orgId),
      body: JSON.stringify(scorecard),
    }, apiKey),
};
