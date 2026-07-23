"use client";

import { useState } from "react";
import {
  useWebhooks,
  type WebhookEndpoint,
  type WebhookEvent,
  type WebhookCreateInput,
  ALL_WEBHOOK_EVENTS,
  WEBHOOK_EVENT_LABELS,
} from "@/hooks/useWebhooks";
import { FadeIn } from "@/components/motion/fade-in";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Webhook,
  Check,
  X,
  Send,
  RefreshCw,
  Power,
  PowerOff,
  ExternalLink,
  Clock,
} from "lucide-react";

function maskUrl(url: string) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}${u.port ? `:${u.port}` : ""}/…${u.pathname.slice(-20)}`;
  } catch {
    return url.slice(0, 40) + "…";
  }
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function WebhookRow({
  webhook,
  onToggle,
  onTest,
  onDelete,
  onEdit,
}: {
  webhook: WebhookEndpoint;
  onToggle: (id: string) => void;
  onTest: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (wh: WebhookEndpoint) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isActive = webhook.status === "active";

  return (
    <Card className={`border-border ${!isActive ? "opacity-60" : ""}`}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          {/* Left: info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Webhook className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium text-sm">{webhook.description}</span>
              <Badge
                className={`text-[10px] ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {isActive ? "Active" : "Disabled"}
              </Badge>
              <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[240px]">
                {maskUrl(webhook.url)}
              </span>
            </div>

            {/* Events */}
            <div className="flex flex-wrap gap-1">
              {webhook.events.map((ev) => (
                <Badge
                  key={ev}
                  variant="secondary"
                  className="text-[10px] rounded-md"
                >
                  {ev}
                </Badge>
              ))}
            </div>

            {/* Meta */}
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Created {formatDate(webhook.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                {webhook.lastDeliveryStatus === "success" ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : webhook.lastDeliveryStatus === "failed" ? (
                  <X className="h-3 w-3 text-red-500" />
                ) : (
                  <Clock className="h-3 w-3" />
                )}
                Last delivery: {formatDate(webhook.lastDeliveryAt)}
              </span>
              {webhook.lastDeliveryResponse && (
                <span className="text-[10px] text-muted-foreground">
                  {webhook.lastDeliveryResponse}
                </span>
              )}
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1"
              onClick={() => onTest(webhook.id)}
              title="Send test payload"
            >
              <Send className="h-3.5 w-3.5" />
              <span className="text-xs hidden sm:inline">Test</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1"
              onClick={() => onEdit(webhook)}
              title={isActive ? "Disable" : "Enable"}
            >
              {isActive ? (
                <PowerOff className="h-3.5 w-3.5 text-amber-500" />
              ) : (
                <Power className="h-3.5 w-3.5 text-emerald-500" />
              )}
              <span className="text-xs hidden sm:inline">
                {isActive ? "Disable" : "Enable"}
              </span>
            </Button>
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-red-600"
                  onClick={() => {
                    onDelete(webhook.id);
                    setConfirmDelete(false);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="text-xs">Confirm</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-muted-foreground"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UpsertWebhookDialog({
  open,
  editTarget,
  onClose,
  onSave,
  loading,
}: {
  open: boolean;
  editTarget: WebhookEndpoint | null;
  onClose: () => void;
  onSave: (input: WebhookCreateInput & { id?: string }) => Promise<void>;
  loading: boolean;
}) {
  const [url, setUrl] = useState(editTarget?.url ?? "");
  const [description, setDescription] = useState(editTarget?.description ?? "");
  const [events, setEvents] = useState<WebhookEvent[]>(editTarget?.events ?? ["candidate.qualified"]);
  const [secret, setSecret] = useState("");

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !description.trim() || events.length === 0) return;

    await onSave({
      id: editTarget?.id,
      url: url.trim(),
      description: description.trim(),
      events,
      secret: secret.trim() || undefined,
    });

    setUrl("");
    setDescription("");
    setEvents(["candidate.qualified"]);
    setSecret("");
    onClose();
  };

  const toggleEvent = (ev: WebhookEvent) => {
    setEvents((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev],
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-lg mx-4 border-border shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-lg">
            {editTarget ? "Edit webhook" : "Create webhook endpoint"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="wh-url">Endpoint URL</Label>
              <Input
                id="wh-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-server.com/webhooks/hireloop"
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                HTTPS endpoint that receives webhook POST requests
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wh-desc">Description</Label>
              <Input
                id="wh-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Production HRIS sync"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Events to subscribe to</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {ALL_WEBHOOK_EVENTS.map((ev) => (
                  <label
                    key={ev}
                    className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 transition-colors ${
                      events.includes(ev)
                        ? "border-brand bg-brand-muted"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={events.includes(ev)}
                      onChange={() => toggleEvent(ev)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                    />
                    <div>
                      <span className="text-sm font-medium">{ev}</span>
                      <p className="text-[10px] text-muted-foreground">
                        {WEBHOOK_EVENT_LABELS[ev]}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wh-secret">
                Signing secret{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="wh-secret"
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Leave empty to auto-generate"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Used to sign webhook payloads via HMAC-SHA256
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !url.trim() || !description.trim() || events.length === 0}
                className="rounded-full bg-brand hover:bg-brand/90"
              >
                {loading
                  ? "Saving…"
                  : editTarget
                    ? "Update webhook"
                    : "Create webhook"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function WebhooksManager() {
  const {
    webhooks,
    loading,
    createWebhook,
    updateWebhook,
    toggleWebhook,
    deleteWebhook,
    testWebhook,
  } = useWebhooks();

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<WebhookEndpoint | null>(null);

  const handleSave = async (input: WebhookCreateInput & { id?: string }) => {
    if (input.id) {
      await updateWebhook(input.id, input);
    } else {
      await createWebhook(input);
    }
  };

  const handleEdit = (wh: WebhookEndpoint) => {
    setEditTarget(wh);
    setShowForm(true);
  };

  return (
    <FadeIn className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-title">Webhooks</h2>
          <p className="text-caption text-muted-foreground">
            Send real-time events to external systems when candidates progress
          </p>
        </div>
        <Button
          onClick={() => {
            setEditTarget(null);
            setShowForm(true);
          }}
          className="rounded-full bg-brand hover:bg-brand/90"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add endpoint
        </Button>
      </div>

      {/* Info card */}
      <Card className="border-brand/30 bg-brand-muted/50">
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          <ExternalLink className="h-5 w-5 shrink-0 text-brand mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium">How webhooks work</p>
            <p className="text-xs text-muted-foreground">
              When a tracked event occurs, HireLoop sends an HTTP POST request to your endpoint
              with a JSON payload. The request includes an <code className="rounded bg-muted px-1">x-hireloop-signature</code>{" "}
              header (HMAC-SHA256) for verification. Respond with HTTP 200 to acknowledge delivery;
              failed deliveries retry up to 3 times with exponential backoff.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Loading indicator */}
      {loading && (
        <p className="text-sm text-muted-foreground animate-pulse">Processing…</p>
      )}

      {/* Empty state */}
      {webhooks.length === 0 && !loading ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Webhook className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium">No webhook endpoints</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Configure endpoints to receive candidate lifecycle events in your external systems.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditTarget(null);
                setShowForm(true);
              }}
              className="mt-2"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add endpoint
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {webhooks.map((wh) => (
            <WebhookRow
              key={wh.id}
              webhook={wh}
              onToggle={toggleWebhook}
              onTest={testWebhook}
              onDelete={deleteWebhook}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Upsert dialog */}
      <UpsertWebhookDialog
        open={showForm}
        editTarget={editTarget}
        onClose={() => {
          setShowForm(false);
          setEditTarget(null);
        }}
        onSave={handleSave}
        loading={loading}
      />
    </FadeIn>
  );
}