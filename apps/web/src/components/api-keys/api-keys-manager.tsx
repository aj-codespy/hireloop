"use client";

import { useState } from "react";
import { useApiKeys, type ApiKey, type ApiKeyScope, type ApiKeyCreateInput } from "@/hooks/useApiKeys";
import { FadeIn } from "@/components/motion/fade-in";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import { toast } from "sonner";

const SCOPE_LABELS: Record<ApiKeyScope, string> = {
  read: "Read-only",
  write: "Read + Write",
  admin: "Full access",
};

const SCOPE_COLORS: Record<ApiKeyScope, string> = {
  read: "bg-slate-100 text-slate-700",
  write: "bg-orange-50 text-orange-700",
  admin: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

function maskDate(d: string | null) {
  if (!d) return "Never";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function KeyRow({
  keyItem,
  onRevoke,
  onDelete,
}: {
  keyItem: ApiKey;
  onRevoke: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingRevoke, setConfirmingRevoke] = useState(false);
  const [copied, setCopied] = useState(false);

  const isActive = keyItem.status === "active";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(keyItem.prefix);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <PhosphorIcon name="Key" className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium text-sm">{keyItem.name}</span>
          <span className="font-mono text-xs text-muted-foreground">{keyItem.prefix}</span>
          <Badge
            className={`text-[10px] ${
              isActive
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
            }`}
          >
            {SCOPE_LABELS[keyItem.scope]}
          </Badge>
          <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] ${SCOPE_COLORS[keyItem.scope]}`}>
            {keyItem.scope === "admin" ? (
              <PhosphorIcon name="ShieldWarning" className="h-3 w-3" />
            ) : (
              <PhosphorIcon name="Shield" className="h-3 w-3" />
            )}
            {SCOPE_LABELS[keyItem.scope]}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
          <span className="flex items-center gap-1">
            <PhosphorIcon name="Clock" className="h-3 w-3" />
            Created {maskDate(keyItem.createdAt)}
          </span>
          <span>Last used {maskDate(keyItem.lastUsedAt)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1"
          onClick={handleCopy}
          aria-label="Copy key prefix"
        >
          {copied ? <PhosphorIcon name="Check" className="h-3.5 w-3.5 text-emerald-500" /> : <PhosphorIcon name="Copy" className="h-3.5 w-3.5" />}
          <span className="text-xs">{copied ? "Copied" : "Copy"}</span>
        </Button>
        {isActive && confirmingRevoke ? (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => {
                onRevoke(keyItem.id);
                setConfirmingRevoke(false);
              }}
            >
              Confirm revoke
            </Button>
            <Button variant="ghost" size="sm" className="h-8" onClick={() => setConfirmingRevoke(false)}>
              Cancel
            </Button>
          </div>
        ) : isActive ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => setConfirmingRevoke(true)}
            aria-label="Revoke key"
          >
            <PhosphorIcon name="EyeOff" className="h-3.5 w-3.5" />
            <span className="text-xs">Revoke</span>
          </Button>
        ) : confirmingDelete ? (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-red-600"
              onClick={() => {
                onDelete(keyItem.id);
                setConfirmingDelete(false);
              }}
              aria-label="Confirm delete"
            >
              <PhosphorIcon name="Trash2" className="h-3.5 w-3.5" />
              <span className="text-xs">Confirm</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => setConfirmingDelete(false)}
              aria-label="Cancel delete"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-muted-foreground"
            onClick={() => setConfirmingDelete(true)}
            aria-label="Delete key"
          >
            <PhosphorIcon name="Trash2" className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

function CreateKeyDialog({
  open,
  onClose,
  onCreate,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: ApiKeyCreateInput) => Promise<string>;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [scope, setScope] = useState<ApiKeyScope>("read");

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onCreate({ name: name.trim(), scope });
    setName("");
    setScope("read");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 border-border shadow-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Create API key</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="key-name">Key name</Label>
              <Input
                id="key-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Production CI"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Permissions</Label>
              <div className="grid gap-2">
                {(["read", "write", "admin"] as ApiKeyScope[]).map((s) => (
                  <label
                    key={s}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      scope === s
                        ? "border-brand bg-brand-muted"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <input
                      type="radio"
                      name="scope"
                      value={s}
                      checked={scope === s}
                      onChange={() => setScope(s)}
                      className="sr-only"
                    />
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                        scope === s ? "border-brand" : "border-muted-foreground"
                      }`}
                    >
                      {scope === s && <span className="h-2 w-2 rounded-full bg-brand" />}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{SCOPE_LABELS[s]}</span>
                      <span className="text-xs text-muted-foreground">
                        {s === "read"
                          ? "View candidates, jobs, and reports"
                          : s === "write"
                          ? "Create jobs, manage candidates, configure settings"
                          : "Full access including team and billing"}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !name.trim()} className="rounded-full bg-brand hover:bg-brand/90">
                {loading ? "Creating…" : "Create key"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function ApiKeysManager() {
  const { keys, loading, newlyCreatedKey, clearNewlyCreatedKey, createKey, revokeKey, deleteKey } = useApiKeys();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <FadeIn className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-title">API Keys</h2>
          <p className="text-caption text-muted-foreground">
            Manage keys for programmatic access to the HireLoop API
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="rounded-full bg-brand hover:bg-brand/90"
        >
          <PhosphorIcon name="Plus" className="mr-1.5 h-4 w-4" />
          Create key
        </Button>
      </div>

      {/* Newly created key banner */}
      {newlyCreatedKey && (
        <Card className="border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="flex items-start justify-between gap-4 p-4">
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                Key created. Copy it now because you won&apos;t see it again.
              </p>
              <code className="block select-all break-all rounded bg-emerald-100 px-2 py-1 font-mono text-xs dark:bg-emerald-900/40">
                {newlyCreatedKey}
              </code>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 h-8"
              onClick={() => {
                navigator.clipboard.writeText(newlyCreatedKey);
                toast.success("Copied");
              }}
            >
              <PhosphorIcon name="Copy" className="h-3.5 w-3.5 mr-1" />
              Copy
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Key list */}
      {keys.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <PhosphorIcon name="Key" className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium">No API keys yet</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Create your first key to access the HireLoop API programmatically.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreate(true)}
              className="mt-2"
            >
              <PhosphorIcon name="Plus" className="mr-1 h-4 w-4" />
              Create key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {loading && (
            <p className="text-sm text-muted-foreground animate-pulse">Updating…</p>
          )}
          {keys.map((keyItem) => (
            <KeyRow
              key={keyItem.id}
              keyItem={keyItem}
              onRevoke={revokeKey}
              onDelete={deleteKey}
            />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <CreateKeyDialog
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          clearNewlyCreatedKey();
        }}
        onCreate={createKey}
        loading={loading}
      />
    </FadeIn>
  );
}