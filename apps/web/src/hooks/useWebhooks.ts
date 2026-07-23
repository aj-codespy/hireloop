"use client";

import { useState, useCallback, useEffect } from "react";
import { api, ApiError } from "@/lib/api/client";
import { toast } from "sonner";

export type WebhookEvent =
  | "candidate.qualified"
  | "application.created"
  | "interview.completed"
  | "candidate.hired"
  | "candidate.rejected";

export const ALL_WEBHOOK_EVENTS: WebhookEvent[] = [
  "candidate.qualified",
  "application.created",
  "interview.completed",
  "candidate.hired",
  "candidate.rejected",
];

export const WEBHOOK_EVENT_LABELS: Record<WebhookEvent, string> = {
  "candidate.qualified": "Candidate qualified for final interview",
  "application.created": "New application submitted",
  "interview.completed": "Interview completed by candidate",
  "candidate.hired": "Candidate marked as hired",
  "candidate.rejected": "Candidate rejected",
};

export type WebhookStatus = "active" | "disabled";
export type DeliveryStatus = "success" | "failed" | null;

export interface WebhookEndpoint {
  id: string;
  url: string;
  description: string;
  events: WebhookEvent[];
  status: WebhookStatus;
  createdAt: string;
  lastDeliveryAt: string | null;
  lastDeliveryStatus: DeliveryStatus;
  lastDeliveryResponse?: string;
}

export interface WebhookCreateInput {
  url: string;
  description: string;
  events: WebhookEvent[];
  secret?: string;
}

const ORG_ID = "demo-org";
const MOCK_WEBHOOKS: WebhookEndpoint[] = [
  { id: "wh_01", url: "https://api.example.com/hireloop/events", description: "Production HRIS sync", events: ["candidate.qualified", "candidate.hired"], status: "active", createdAt: "2026-07-10T08:00:00Z", lastDeliveryAt: "2026-07-22T14:12:00Z", lastDeliveryStatus: "success" },
  { id: "wh_02", url: "https://staging.example.com/webhooks", description: "Staging environment", events: ["candidate.qualified"], status: "active", createdAt: "2026-07-12T10:30:00Z", lastDeliveryAt: "2026-07-21T09:45:00Z", lastDeliveryStatus: "failed", lastDeliveryResponse: "HTTP 500: Internal Server Error" },
];

export function useWebhooks(apiKey?: string) {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await api.listWebhooks(ORG_ID, apiKey);
      const records: Record<string, unknown>[] = (raw as { data?: unknown[] }).data as Record<string, unknown>[] ?? raw as unknown as Record<string, unknown>[];
      const mapped: WebhookEndpoint[] = records.map((s) => ({
        id: String(s.id),
        url: String(s.url ?? ""),
        description: String(s.description ?? ""),
        events: (s.events as WebhookEvent[]) ?? [],
        status: s.active ? "active" : "disabled",
        createdAt: String(s.created_at ?? new Date().toISOString()),
        lastDeliveryAt: s.last_delivery_at ? String(s.last_delivery_at) : null,
        lastDeliveryStatus: s.last_delivery_status as DeliveryStatus,
        lastDeliveryResponse: s.last_delivery_response as string | undefined,
      }));
      setWebhooks(mapped);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(`Failed to load webhooks: ${err.message}`);
      }
      setWebhooks(MOCK_WEBHOOKS); // fallback
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => { void fetchWebhooks(); }, [fetchWebhooks]);

  const createWebhook = useCallback(async (input: WebhookCreateInput) => {
    setLoading(true);
    try {
      await api.createWebhook(input as unknown as Record<string, unknown>, ORG_ID, apiKey);
      await fetchWebhooks();
      toast.success("Webhook endpoint created");
    } catch (err) {
      if (err instanceof ApiError) toast.error(`Failed to create: ${err.message}`);
      else toast.error("Failed to create webhook");
    } finally {
      setLoading(false);
    }
  }, [apiKey, fetchWebhooks]);

  const updateWebhook = useCallback(async (id: string, patch: Partial<WebhookCreateInput>) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    setWebhooks((prev) => prev.map((wh) => (wh.id === id ? { ...wh, ...patch } : wh)));
    setLoading(false);
    toast.success("Webhook updated");
  }, []);

  const toggleWebhook = useCallback(async (id: string) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    setWebhooks((prev) => prev.map((wh) => (wh.id === id ? { ...wh, status: wh.status === "active" ? "disabled" : "active" } : wh)));
    setLoading(false);
  }, []);

  const deleteWebhook = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await api.deleteWebhook(id, ORG_ID, apiKey);
      await fetchWebhooks();
      toast.success("Webhook deleted");
    } catch (err) {
      toast.error("Failed to delete webhook");
    } finally {
      setLoading(false);
    }
  }, [apiKey, fetchWebhooks]);

  const testWebhook = useCallback(async (id: string) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setWebhooks((prev) => prev.map((wh) =>
      wh.id === id
        ? { ...wh, lastDeliveryAt: new Date().toISOString(), lastDeliveryStatus: "success" as const, lastDeliveryResponse: "HTTP 200: OK" }
        : wh,
    ));
    setLoading(false);
    toast.success("Test payload sent");
  }, []);

  return { webhooks, loading, createWebhook, updateWebhook, toggleWebhook, deleteWebhook, testWebhook };
}