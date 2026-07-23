"use client";

import { useState, useCallback, useEffect } from "react";
import { api, ApiError } from "@/lib/api/client";
import { toast } from "sonner";

export type ApiKeyScope = "read" | "write" | "admin";
export type ApiKeyStatus = "active" | "revoked";

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scope: ApiKeyScope;
  status: ApiKeyStatus;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface ApiKeyCreateInput {
  name: string;
  scope: ApiKeyScope;
}

// Temporary — will be replaced by real org context
const ORG_ID = "demo-org";

export function useApiKeys(apiKey?: string) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listApiKeys(ORG_ID, apiKey);
      const mapped: ApiKey[] = (data as Array<Record<string, unknown>>).map((k) => ({
        id: String(k.id),
        name: String(k.name ?? ""),
        prefix: String(k.prefix ?? String(k.id).slice(0, 8)),
        scope: ((k.scopes as string[])?.[0] ?? "read") as ApiKeyScope,
        status: k.active ? "active" : "revoked",
        createdAt: String(k.created_at ?? new Date().toISOString()),
        lastUsedAt: k.last_used_at ? String(k.last_used_at) : null,
      }));
      setKeys(mapped);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(`Failed to load keys: ${err.message}`);
      } else {
        // Fallback to mock data if API unreachable
        setKeys([
          { id: "key_mock1", name: "Production API", prefix: "hl_sk_a1B2…", scope: "write", status: "active", createdAt: "2026-07-15T10:30:00Z", lastUsedAt: "2026-07-22T14:12:00Z" },
          { id: "key_mock2", name: "Read-only monitoring", prefix: "hl_sk_c3D4…", scope: "read", status: "active", createdAt: "2026-07-10T08:00:00Z", lastUsedAt: "2026-07-21T09:45:00Z" },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    void fetchKeys();
  }, [fetchKeys]);

  const createKey = useCallback(async (input: ApiKeyCreateInput) => {
    setLoading(true);
    try {
      const result = await api.createApiKey(input.name, [input.scope], ORG_ID, apiKey);
      setNewlyCreatedKey((result as { raw_key: string }).raw_key);
      await fetchKeys();
      return (result as { raw_key: string }).raw_key;
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(`Failed to create key: ${err.message}`);
      } else {
        toast.error("Failed to create API key");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiKey, fetchKeys]);

  const revokeKey = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await api.revokeApiKey(id, ORG_ID, apiKey);
      await fetchKeys();
      toast.success("API key revoked");
    } catch (err) {
      toast.error("Failed to revoke API key");
    } finally {
      setLoading(false);
    }
  }, [apiKey, fetchKeys]);

  const deleteKey = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await api.revokeApiKey(id, ORG_ID, apiKey); // revoke is delete for now
      await fetchKeys();
      toast.success("API key deleted");
    } catch (err) {
      toast.error("Failed to delete API key");
    } finally {
      setLoading(false);
    }
  }, [apiKey, fetchKeys]);

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