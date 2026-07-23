"use client";

import { useState, useCallback } from "react";
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

// Mock seed data
const MOCK_WEBHOOKS: WebhookEndpoint[] = [
  {
    id: "wh_01",
    url: "https://api.example.com/hireloop/events",
    description: "Production HRIS sync",
    events: ["candidate.qualified", "candidate.hired"],
    status: "active",
    createdAt: "2026-07-10T08:00:00Z",
    lastDeliveryAt: "2026-07-22T14:12:00Z",
    lastDeliveryStatus: "success",
  },
  {
    id: "wh_02",
    url: "https://staging.example.com/webhooks",
    description: "Staging environment",
    events: ["candidate.qualified"],
    status: "active",
    createdAt: "2026-07-12T10:30:00Z",
    lastDeliveryAt: "2026-07-21T09:45:00Z",
    lastDeliveryStatus: "failed",
    lastDeliveryResponse: "HTTP 500: Internal Server Error",
  },
];

function generateId() {
  return `wh_${crypto.randomUUID().slice(0, 6)}`;
}

export function useWebhooks() {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>(MOCK_WEBHOOKS);
  const [loading, setLoading] = useState(false);

  const createWebhook = useCallback(async (input: WebhookCreateInput) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));

    const newWh: WebhookEndpoint = {
      id: generateId(),
      url: input.url,
      description: input.description,
      events: input.events,
      status: "active",
      createdAt: new Date().toISOString(),
      lastDeliveryAt: null,
      lastDeliveryStatus: null,
    };

    setWebhooks((prev) => [newWh, ...prev]);
    setLoading(false);
    toast.success("Webhook endpoint created");
  }, []);

  const updateWebhook = useCallback(
    async (id: string, patch: Partial<WebhookCreateInput>) => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 400));

      setWebhooks((prev) =>
        prev.map((wh) =>
          wh.id === id
            ? { ...wh, ...patch, lastDeliveryAt: wh.lastDeliveryAt, lastDeliveryStatus: wh.lastDeliveryStatus }
            : wh,
        ),
      );
      setLoading(false);
      toast.success("Webhook updated");
    },
    [],
  );

  const toggleWebhook = useCallback(async (id: string) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));

    setWebhooks((prev) =>
      prev.map((wh) =>
        wh.id === id
          ? { ...wh, status: wh.status === "active" ? "disabled" : "active" }
          : wh,
      ),
    );
    setLoading(false);
  }, []);

  const deleteWebhook = useCallback(async (id: string) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    setWebhooks((prev) => prev.filter((wh) => wh.id !== id));
    setLoading(false);
    toast.success("Webhook deleted");
  }, []);

  const testWebhook = useCallback(async (id: string) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));

    // Update the endpoint with test result
    setWebhooks((prev) =>
      prev.map((wh) =>
        wh.id === id
          ? {
              ...wh,
              lastDeliveryAt: new Date().toISOString(),
              lastDeliveryStatus: Math.random() > 0.3 ? "success" : "failed",
              lastDeliveryResponse:
                Math.random() > 0.3
                  ? "HTTP 200: OK"
                  : "HTTP 502: Bad Gateway",
            }
          : wh,
      ),
    );
    setLoading(false);
    toast.success("Test payload sent");
  }, []);

  return {
    webhooks,
    loading,
    createWebhook,
    updateWebhook,
    toggleWebhook,
    deleteWebhook,
    testWebhook,
  };
}