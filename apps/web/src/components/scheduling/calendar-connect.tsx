"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import { toast } from "sonner";

type ConnectionStatus = "disconnected" | "connecting" | "connected";

interface CalendarConnection {
  provider: "google" | "outlook";
  email: string;
  status: ConnectionStatus;
  connectedAt: string | null;
}

export function CalendarConnect() {
  const [connections, setConnections] = useState<CalendarConnection[]>([
    // Mock — will be replaced by API data
    { provider: "google", email: "", status: "disconnected", connectedAt: null },
    { provider: "outlook", email: "", status: "disconnected", connectedAt: null },
  ]);
  const [loading, setLoading] = useState<string | null>(null);

  const handleConnect = async (provider: "google" | "outlook") => {
    setLoading(provider);
    // Simulate OAuth redirect — in production, redirect to backend auth URL
    toast.info(`Redirecting to ${provider} OAuth…`);
    await new Promise((r) => setTimeout(r, 1000));

    setConnections((prev) =>
      prev.map((c) =>
        c.provider === provider
          ? { ...c, status: "connected", email: "user@example.com", connectedAt: new Date().toISOString() }
          : c,
      ),
    );
    setLoading(null);
    toast.success(`${provider === "google" ? "Google" : "Outlook"} Calendar connected`);
  };

  const handleDisconnect = async (provider: "google" | "outlook") => {
    setLoading(provider);
    await new Promise((r) => setTimeout(r, 500));
    setConnections((prev) =>
      prev.map((c) =>
        c.provider === provider
          ? { ...c, status: "disconnected", email: "", connectedAt: null }
          : c,
      ),
    );
    setLoading(null);
    toast.success(`${provider === "google" ? "Google" : "Outlook"} Calendar disconnected`);
  };

  const PROVIDER_LABELS = { google: "Google Calendar", outlook: "Outlook (Microsoft 365)" };
  const PROVIDER_ICONS = { google: "🔴", outlook: "🔵" };

  return (
    <Card className="border-border shadow-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <PhosphorIcon name="Calendar" className="h-4 w-4" />
          Calendar Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Connect your calendar to let interviewers share availability and enable candidate self-scheduling.
        </p>

        {connections.map((conn) => (
          <div
            key={conn.provider}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{PROVIDER_ICONS[conn.provider]}</span>
              <div>
                <p className="text-sm font-medium">{PROVIDER_LABELS[conn.provider]}</p>
                {conn.status === "connected" ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px]">
                      <PhosphorIcon name="CheckCircle2" className="h-3 w-3 mr-0.5" />
                      Connected
                    </Badge>
                    <span className="text-xs text-muted-foreground">{conn.email}</span>
                  </div>
                ) : (
                  <Badge className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 text-[10px] mt-0.5">
                    <PhosphorIcon name="XCircle" className="h-3 w-3 mr-0.5" />
                    Not connected
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {conn.status === "connected" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={loading === conn.provider}
                  onClick={() => handleDisconnect(conn.provider)}
                >
                  {loading === conn.provider ? (
                    <PhosphorIcon name="Loader2" className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Disconnect"
                  )}
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="h-8 rounded-full bg-brand hover:bg-brand/90"
                  disabled={loading === conn.provider}
                  onClick={() => handleConnect(conn.provider)}
                >
                  {loading === conn.provider ? (
                    <PhosphorIcon name="Loader2" className="h-3.5 w-3.5 animate-spin mr-1" />
                  ) : null}
                  Connect
                </Button>
              )}
            </div>
          </div>
        ))}

        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1">
                    <PhosphorIcon name="ExternalLink" className="h-3 w-3" />
                    Calendar data is used only for availability &mdash; events are created only when interviews are scheduled.
                  </p>
                </div>
      </CardContent>
    </Card>
  );
}