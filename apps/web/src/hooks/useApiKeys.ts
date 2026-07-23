"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

export type ApiKeyScope = "read" | "write" | "admin";
export type ApiKeyStatus = "active" | "revoked";

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;          // First 8 chars shown in UI
  scope: ApiKeyScope;
  status: ApiKeyStatus;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface ApiKeyCreateInput {
  name: string;
  scope: ApiKeyScope;
}

// Mock seed data — swap for real API calls
const MOCK_KEYS: ApiKey[] = [
  {
    id: "key_01j8",
    name: "Production API",
    prefix: "hl_sk_a1B2",
    scope: "write",
    status: "active",
    createdAt: "2026-07-15T10:30:00Z",
    lastUsedAt: "2026-07-22T14:12:00Z",
  },
  {
    id: "key_02k9",
    name: "Read-only monitoring",
    prefix: "hl_sk_c3D4",
    scope: "read",
    status: "active",
    createdAt: "2026-07-10T08:00:00Z",
    lastUsedAt: "2026-07-21T09:45:00Z",
  },
];

function generateKey(): { raw: string; prefix: string } {
  const raw = `hl_sk_${crypto.randomUUID().replace(/-/g, "").slice(0, 32)}`;
  return { raw, prefix: raw.slice(0, 11) + "…" };
}

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>(MOCK_KEYS);
  const [loading, setLoading] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  const createKey = useCallback(async (input: ApiKeyCreateInput) => {
    setLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 600));

    const { raw, prefix } = generateKey();
    const newKey: ApiKey = {
      id: `key_${crypto.randomUUID().slice(0, 6)}`,
      name: input.name,
      prefix,
      scope: input.scope,
      status: "active",
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
    };

    setKeys((prev) => [newKey, ...prev]);
    setNewlyCreatedKey(raw); // Show once
    setLoading(false);
    toast.success("API key created");
    return raw;
  }, []);

  const revokeKey = useCallback(async (id: string) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    setKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, status: "revoked" as const } : k)),
    );
    setLoading(false);
    toast.success("API key revoked");
  }, []);

  const deleteKey = useCallback(async (id: string) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    setKeys((prev) => prev.filter((k) => k.id !== id));
    setLoading(false);
    toast.success("API key deleted");
  }, []);

  return {
    keys,
    loading,
    newlyCreatedKey,
    clearNewlyCreatedKey: () => setNewlyCreatedKey(null),
    createKey,
    revokeKey,
    deleteKey,
  };
}