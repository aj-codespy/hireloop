"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useApplicationRows, useHireLoop } from "@/lib/store/provider";
import { PIPELINE_COLUMNS, APPLICATION_STATUS_LABELS } from "@/lib/constants";
import type { ApplicationStatus } from "@/lib/types";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function daysInStage(createdAt: string): number {
  return Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24),
  );
}

export type PipelineCandidate = {
  applicationId: string;
  candidateName: string;
  candidateInitials: string;
  jobTitle: string;
  status: ApplicationStatus;
  createdAt: string;
  score?: number | null;
  hasResume: boolean;
};

export type PipelineColumn = {
  status: ApplicationStatus;
  label: string;
  candidates: PipelineCandidate[];
};

export function useInterviewPipeline() {
  const rows = useApplicationRows();
  const { state } = useHireLoop();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const availableJobs = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of rows) {
      if (row.job?.id && row.job?.title) {
        map.set(row.job.id, row.job.title);
      }
    }
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [rows]);

  const columns: PipelineColumn[] = useMemo(() => {
    const filtered = rows.filter(({ application, candidate, job }) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = candidate?.name?.toLowerCase() ?? "";
        const jobTitle = job?.title?.toLowerCase() ?? "";
        if (!name.includes(q) && !jobTitle.includes(q)) return false;
      }
      if (selectedJobId && job?.id !== selectedJobId) return false;
      return true;
    });

    return PIPELINE_COLUMNS.map((status) => ({
      status,
      label: APPLICATION_STATUS_LABELS[status],
      candidates: filtered
        .filter(({ application }) => application.status === status)
        .map(({ application, candidate, job, session }) => ({
          applicationId: application.id,
          candidateName: candidate?.name ?? "Unknown",
          candidateInitials: initials(candidate?.name ?? "??"),
          jobTitle: job?.title ?? "&mdash;",
          status: application.status as ApplicationStatus,
          createdAt: application.createdAt,
          score: session?.overallScore?.totalScore,
          hasResume: !!candidate?.resumeUrl,
        })),
    }));
  }, [rows, searchQuery, selectedJobId]);

  const handleDragEnd = useCallback(
    (activeId: string, overId: string | null) => {
      if (!overId || activeId === overId) return;
      const [targetStatus] = overId.split(":");
      if (
        !targetStatus ||
        !PIPELINE_COLUMNS.includes(targetStatus as ApplicationStatus)
      )
        return;

      toast.success(
        `Moved to ${APPLICATION_STATUS_LABELS[targetStatus as ApplicationStatus] ?? targetStatus}`,
      );
    },
    [],
  );

  const staleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const col of columns) {
      counts[col.status] = col.candidates.filter(
        (c) => daysInStage(c.createdAt) > 3,
      ).length;
    }
    return counts;
  }, [columns]);

  return {
    columns,
    searchQuery,
    setSearchQuery,
    selectedJobId,
    setSelectedJobId,
    availableJobs,
    handleDragEnd,
    staleCounts,
    totalCandidates: rows.length,
    organizationName: state.organization.name,
  };
}

// ─── API-backed hook (replaces store data with REST API data) ────────

const ORG_ID = "demo-org";

export function useApiPipeline() {
  const [columns, setColumns] = useState<PipelineColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const { state } = useHireLoop();

  useEffect(() => {
    async function load() {
      try {
        const { data: applications } = await api.listApplications(ORG_ID);
        const grouped = PIPELINE_COLUMNS.map((status) => ({
          status,
          label: APPLICATION_STATUS_LABELS[status],
          candidates: ((applications as Array<Record<string, unknown>>) ?? [])
            .filter((a) => a.status === status)
            .map((a) => ({
              applicationId: String(a.id),
              candidateName: String((a as { candidate?: { name: string } }).candidate?.name ?? (a as { candidate_name?: string }).candidate_name ?? "Unknown"),
              candidateInitials: initials(String((a as { candidate?: { name: string } }).candidate?.name ?? "??")),
              jobTitle: String((a as { job?: { title: string } }).job?.title ?? "&mdash;"),
              status: status as ApplicationStatus,
              createdAt: String(a.created_at ?? new Date().toISOString()),
              score: (a as Record<string, unknown>).score as number | null ?? null,
              hasResume: false,
            })),
        }));
        setColumns(grouped);
      } catch {
        // Fall back silently
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return {
    columns,
    loading,
    searchQuery: "",
    setSearchQuery: () => {},
    selectedJobId: null,
    setSelectedJobId: () => {},
    availableJobs: [],
    handleDragEnd: () => {},
    staleCounts: {},
    totalCandidates: columns.reduce((s, c) => s + c.candidates.length, 0),
    organizationName: state.organization.name,
  };
}