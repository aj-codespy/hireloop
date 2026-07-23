"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface TimeSlot {
  id: string;
  startsAt: string;
  endsAt: string;
  interviewerName: string;
}

// Mock data — replaced with API call
const MOCK_SLOTS: TimeSlot[] = [
  { id: "s1", startsAt: "2026-07-25T09:00:00Z", endsAt: "2026-07-25T10:00:00Z", interviewerName: "Alex Chen" },
  { id: "s2", startsAt: "2026-07-25T10:00:00Z", endsAt: "2026-07-25T11:00:00Z", interviewerName: "Alex Chen" },
  { id: "s3", startsAt: "2026-07-25T14:00:00Z", endsAt: "2026-07-25T15:00:00Z", interviewerName: "Sarah Kim" },
  { id: "s4", startsAt: "2026-07-26T09:00:00Z", endsAt: "2026-07-26T10:00:00Z", interviewerName: "Alex Chen" },
  { id: "s5", startsAt: "2026-07-26T11:00:00Z", endsAt: "2026-07-26T12:00:00Z", interviewerName: "Sarah Kim" },
  { id: "s6", startsAt: "2026-07-27T13:00:00Z", endsAt: "2026-07-27T14:00:00Z", interviewerName: "Mike Johnson" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function groupByDate(slots: TimeSlot[]): Record<string, TimeSlot[]> {
  const grouped: Record<string, TimeSlot[]> = {};
  for (const slot of slots) {
    const dateKey = slot.startsAt.split("T")[0];
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(slot);
  }
  return grouped;
}

export default function SchedulePage() {
  const params = useParams();
  const token = params?.token as string;
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/schedule/${token}/slots`);
        if (res.ok) {
          const data = await res.json();
          setSlots(data.slots ?? []);
        } else {
          setSlots(MOCK_SLOTS); // fallback
        }
      } catch {
        setSlots(MOCK_SLOTS);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [token]);

  const handleBook = async () => {
    if (!selectedSlot) return;
    setBooking(true);
    await new Promise((r) => setTimeout(r, 1000)); // Simulate API call
    setBooked(true);
    setBooking(false);
    toast.success("Interview scheduled!");
  };

  if (booked) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-md py-20"
      >
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20 text-center">
          <CardContent className="py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40"
            >
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </motion.div>
            <h2 className="mt-4 text-2xl font-bold">Interview Scheduled</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your interview has been booked. Check your email for the calendar invitation and meeting link.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <p className="text-sm text-muted-foreground animate-pulse">Loading available slots…</p>
      </div>
    );
  }

  const grouped = groupByDate(slots);
  const selectedSlotData = slots.find((s) => s.id === selectedSlot);

  return (
    <div className="mx-auto max-w-lg py-10 px-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Pick a time for your interview</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Select a slot that works for you — each interview is 60 minutes.
          </p>
        </div>

        <div className="space-y-4">
          {Object.entries(grouped).map(([dateKey, daySlots]) => (
            <div key={dateKey}>
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                {formatDate(daySlots[0].startsAt)}
              </p>
              <div className="grid gap-2">
                {daySlots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                      selectedSlot === slot.id
                        ? "border-brand bg-brand-muted ring-1 ring-brand"
                        : "border-border bg-card hover:border-brand/30 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {formatTime(slot.startsAt)} – {formatTime(slot.endsAt)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        with {slot.interviewerName}
                      </p>
                    </div>
                    <ChevronRight className={`h-5 w-5 ${selectedSlot === slot.id ? "text-brand" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {slots.length === 0 && (
          <Card className="border-border text-center">
            <CardContent className="py-12">
              <Calendar className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 font-medium">No available slots</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Interviewers haven&apos;t set their availability yet. Check back later.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="mt-6">
          <Button
            className="w-full rounded-full bg-brand text-brand-foreground hover:bg-brand/90 h-12"
            disabled={!selectedSlot || booking}
            onClick={handleBook}
          >
            {booking ? "Booking…" : selectedSlotData
              ? `Confirm ${formatTime(selectedSlotData.startsAt)} – ${formatTime(selectedSlotData.endsAt)}`
              : "Select a time slot"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}