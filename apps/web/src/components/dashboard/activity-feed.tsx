"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollText, UserPlus, Video, ArrowRight, XCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";

type ActivityType = "application" | "interview" | "stage" | "hired" | "rejected";

interface Activity {
  id: string;
  type: ActivityType;
  message: string;
  timestamp: string;
  href?: string;
}

const ICON_MAP: Record<ActivityType, React.ReactNode> = {
  application: <UserPlus className="h-4 w-4" />,
  interview: <Video className="h-4 w-4" />,
  stage: <ArrowRight className="h-4 w-4" />,
  hired: <CheckCircle2 className="h-4 w-4" />,
  rejected: <XCircle className="h-4 w-4" />,
};

const COLOR_MAP: Record<ActivityType, string> = {
  application: "bg-brand-muted text-brand",
  interview: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300",
  stage: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300",
  hired: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
  rejected: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

interface ActivityFeedProps {
  initial?: Activity[];
  pollingInterval?: number;
}

const MOCK_ACTIVITIES: Activity[] = [
  { id: "a1", type: "application", message: "Priya Sharma applied for Software Engineer", timestamp: new Date(Date.now() - 120000).toISOString(), href: "/admin/candidates" },
  { id: "a2", type: "interview", message: "Rahul Kumar completed AI interview for Product Manager", timestamp: new Date(Date.now() - 1800000).toISOString(), href: "/admin/candidates" },
  { id: "a3", type: "stage", message: "Ananya Patel moved to Final Interview for UX Designer", timestamp: new Date(Date.now() - 3600000).toISOString(), href: "/admin/candidates" },
  { id: "a4", type: "hired", message: "Vikram Singh marked as Hired for Backend Engineer", timestamp: new Date(Date.now() - 7200000).toISOString(), href: "/admin/candidates" },
];

export function ActivityFeed({ initial = MOCK_ACTIVITIES }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>(initial ?? MOCK_ACTIVITIES);
  const [live, setLive] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/activity/recent");
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities ?? []);
      }
    } catch {
      // Silently fall back to mock
    }
  }, []);

  useEffect(() => {
    if (!live) return;
    intervalRef.current = setInterval(() => void poll(), 15000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [live, poll]);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Recent activity</span>
        </div>
        <div className="flex items-center gap-2">
          {live && <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Live" />}
          <button
            onClick={() => setLive(!live)}
            className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
              live ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
            }`}
          >
            {live ? "LIVE" : "PAUSED"}
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-border">
        <AnimatePresence initial={false}>
          {activities.map((a) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
            >
              <Link
                href={a.href ?? "#"}
                className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${COLOR_MAP[a.type]}`}>
                  {ICON_MAP[a.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug group-hover:text-foreground transition-colors">
                    {a.message}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {relativeTime(a.timestamp)}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>

        {activities.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No recent activity
          </div>
        )}
      </div>
    </div>
  );
}