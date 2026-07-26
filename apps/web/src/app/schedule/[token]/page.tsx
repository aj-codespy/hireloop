"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import { Button } from "@/components/ui/button";
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
  return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date(iso));
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
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
  const reduceMotion = useReducedMotion();
  const params = useParams();
  const token = params?.token as string;
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/schedule/${token}/slots`);
        if (res.ok) {
          const data = await res.json();
          setSlots(data.slots ?? []);
        } else {
          setSlots(MOCK_SLOTS); // fallback
          setUsingFallback(true);
        }
      } catch {
        setSlots(MOCK_SLOTS);
        setUsingFallback(true);
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
      <main className="flex min-h-[100dvh] items-center justify-center bg-stone-50 px-5 py-12">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-[0_12px_40px_rgba(15,15,15,0.06)]"
        >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <PhosphorIcon name="CheckCircle2" className="h-6 w-6 text-emerald-700" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">Interview scheduled</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Your interview has been booked. Check your email for the calendar invitation and meeting link.
            </p>
        </motion.div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-stone-50 px-5">
        <p className="flex items-center gap-3 text-sm text-slate-600" role="status" aria-live="polite">
          <span className="size-4 animate-spin rounded-full border-2 border-stone-200 border-t-[#F97316] motion-reduce:animate-none" aria-hidden />
          Loading available times…
        </p>
      </main>
    );
  }

  const grouped = groupByDate(slots);
  const selectedSlotData = slots.find((s) => s.id === selectedSlot);

  return (
    <main className="min-h-[100dvh] bg-stone-50 px-5 pb-[max(4rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))] text-slate-900 sm:px-8">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="mx-auto max-w-xl"
      >
        <div className="mb-10">
          <p className="text-sm font-semibold text-[#F97316]">Interview scheduling</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Choose a time</h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Select a time that works for you. Each interview is 60 minutes.
          </p>
        </div>

        {usingFallback ? (
          <p className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
            Live availability could not be reached. Showing temporary example times.
          </p>
        ) : null}

        <div className="space-y-7">
          {Object.entries(grouped).map(([dateKey, daySlots]) => (
            <div key={dateKey}>
              <h2 className="mb-3 text-sm font-semibold text-slate-700">
                {formatDate(daySlots[0].startsAt)}
              </h2>
              <div className="grid gap-2">
                {daySlots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot.id)}
                    aria-pressed={selectedSlot === slot.id}
                    className={`flex min-h-16 w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2 motion-reduce:transition-none ${
                      selectedSlot === slot.id
                        ? "border-[#F97316] bg-orange-50"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100">
                      <PhosphorIcon name="Clock" className="h-5 w-5 text-slate-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {formatTime(slot.startsAt)} to {formatTime(slot.endsAt)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        with {slot.interviewerName}
                      </p>
                    </div>
                    <PhosphorIcon name="ChevronRight" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {slots.length === 0 && (
          <div className="rounded-3xl border border-stone-200 bg-white p-8">
              <PhosphorIcon name="Calendar" className="h-8 w-8 text-slate-400" />
              <h2 className="mt-5 font-semibold">No available times</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Interviewers haven&apos;t set their availability yet. Check back later.
              </p>
          </div>
        )}

        <div className="mt-6">
          <Button
            className="h-12 w-full rounded-full bg-[#F97316] px-6 font-semibold text-white hover:bg-[#EA6B2D]"
            disabled={!selectedSlot || booking}
            onClick={handleBook}
          >
            {booking ? "Booking…" : selectedSlotData
              ? `Confirm ${formatTime(selectedSlotData.startsAt)} to ${formatTime(selectedSlotData.endsAt)}`
              : "Select a time slot"}
          </Button>
        </div>
      </motion.div>
    </main>
  );
}