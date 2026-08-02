"use client";

import Link from "next/link";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import { useApplicationRows, useHireLoop } from "@/lib/store/provider";
import { APPLICATION_STATUS_LABELS } from "@/lib/constants";
import { StatusBadge } from "@/components/patterns/status-badge";
import { formatDate } from "@/lib/format";
import { FadeIn } from "@/components/motion/fade-in";
import { InterviewPipeline } from "@/components/candidates/interview-pipeline";
import { ButtonLink } from "@/components/ui/button-link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const VIEW_KEY = "hireloop-candidates-view";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
}

export function CandidatesTable() {
  const { hydrated, state } = useHireLoop();
  const [jobFilter, setJobFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"table" | "board">("table");
  const rows = useApplicationRows();

  useEffect(() => {
    const stored = localStorage.getItem(VIEW_KEY);
    if (stored === "table" || stored === "board") setView(stored);
  }, []);

  function switchView(next: "table" | "board") {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // Best-effort persistence — storage may be unavailable
    }
  }

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (jobFilter !== "all" && r.application.jobRoleId !== jobFilter) return false;
      if (statusFilter !== "all" && r.application.status !== statusFilter) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return [r.candidate?.name, r.candidate?.email, r.job?.title, r.application.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [rows, jobFilter, statusFilter, query]);

  if (!hydrated) return (
    <div className="space-y-4 p-4" role="status" aria-label="Loading candidates">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );

  return (
    <FadeIn className="min-w-0 space-y-6">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">Candidates</h1>
        <p className="mt-2 text-sm text-slate-600">
          Review applicants, interview progress, and hiring decisions.
        </p>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <label htmlFor="candidate-search" className="sr-only">
            Search candidates
          </label>
          <Input
            id="candidate-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search candidates"
            className="w-full sm:w-[220px] rounded-full bg-card"
          />
          <Select value={jobFilter} onValueChange={(v) => setJobFilter(v ?? "all")}>
            <SelectTrigger className="w-full sm:w-[200px] rounded-full bg-card">
              <SelectValue placeholder="All jobs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All jobs</SelectItem>
              {state.jobs.map((j) => (
                <SelectItem key={j.id} value={j.id}>
                  {j.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger className="w-full sm:w-[180px] rounded-full bg-card">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(APPLICATION_STATUS_LABELS).map(([status, label]) => (
                <SelectItem key={status} value={status}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup type="single" value={view} onValueChange={(v) => v && switchView(v as any)} className="rounded-full border border-border bg-card p-0.5 gap-0">
            <ToggleGroupItem value="table" className="h-8 rounded-full px-3 text-xs data-[state=on]:bg-brand data-[state=on]:text-brand-foreground data-[state=on]:hover:bg-brand/90">
              <PhosphorIcon name="List" className="h-3.5 w-3.5 mr-1" />
              Table
            </ToggleGroupItem>
            <ToggleGroupItem value="board" className="h-8 rounded-full px-3 text-xs data-[state=on]:bg-brand data-[state=on]:text-brand-foreground data-[state=on]:hover:bg-brand/90">
              <PhosphorIcon name="LayoutGrid" className="h-3.5 w-3.5 mr-1" />
              Board
            </ToggleGroupItem>
          </ToggleGroup>
          <ButtonLink href="/admin/jobs/new" className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
          <PhosphorIcon name="Plus" className="mr-1 h-4 w-4" />
          <span className="hidden sm:inline">Create job</span>
          <kbd className="ml-1.5 hidden rounded-sm bg-brand-foreground/20 px-1.5 py-0.5 text-[10px] font-medium text-brand-foreground/80 sm:inline">⌘N</kbd>
        </ButtonLink>
        </div>
      </div>

      {view === "board" ? <InterviewPipeline /> : null}

      {view === "table" ? (
      <div className="max-w-full overflow-x-auto border-y border-slate-200">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="cursor-pointer hover:text-foreground transition-colors">
                <span className="flex items-center gap-1">
                  Name
                  <PhosphorIcon name="ArrowUpDown" className="h-3 w-3 opacity-30" />
                </span>
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="cursor-pointer hover:text-foreground transition-colors">
                <span className="flex items-center gap-1">
                  Job
                  <PhosphorIcon name="ArrowUpDown" className="h-3 w-3 opacity-30" />
                </span>
              </TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Shortlisted</TableHead>
              <TableHead>Interview done</TableHead>
              <TableHead className="cursor-pointer hover:text-foreground transition-colors">
                <span className="flex items-center gap-1">
                  Applied
                  <PhosphorIcon name="ArrowUpDown" className="h-3 w-3 opacity-30" />
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  No candidates yet
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(({ application, candidate, job, interviewed }) => {
                if (!candidate) return null;
                const shortlisted = !["applied", "auto_rejected"].includes(application.status);
                return (
                  <TableRow key={application.id}>
                    <TableCell>
                      <HoverCard>
                        <HoverCardTrigger
                          render={
                            <Link href={`/admin/candidates/${candidate.id}`} className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-brand-muted text-xs text-brand">
                                  {initials(candidate.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium hover:text-brand">{candidate.name}</span>
                            </Link>
                          }
                        />
                        <HoverCardContent className="w-64 p-3" side="right" align="start">
                          <div className="space-y-2">
                            <p className="text-sm font-medium">{candidate.name}</p>
                            <p className="text-xs text-muted-foreground">{candidate.email}</p>
                            <div className="flex items-center gap-2 text-xs">
                              <StatusBadge status={application.status} />
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-muted-foreground">
                      {candidate.email}
                    </TableCell>
                    <TableCell className="max-w-[160px] truncate">{job?.title}</TableCell>
                    <TableCell>
                      <StatusBadge status={application.status} />
                    </TableCell>
                    <TableCell>
                      {shortlisted ? (
                        <PhosphorIcon name="CheckCircle2" className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <PhosphorIcon name="XCircle" className="h-4 w-4 text-red-400" />
                      )}
                    </TableCell>
                    <TableCell>
                      {interviewed ? (
                        <PhosphorIcon name="CheckCircle2" className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <span className="text-xs text-muted-foreground">Pending</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">
                      {formatDate(application.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      ) : null}
      <div className="flex items-center justify-between gap-4 pt-2">
        <p className="text-sm text-muted-foreground">
          {filtered.length} application{filtered.length !== 1 ? "s" : ""}
        </p>
        {filtered.length > 20 ? (
          <Pagination className="w-auto">
            <PaginationContent>
              <PaginationItem><PaginationPrevious href="#" onClick={(e) => e.preventDefault()} /></PaginationItem>
              <PaginationItem><PaginationNext href="#" onClick={(e) => e.preventDefault()} /></PaginationItem>
            </PaginationContent>
          </Pagination>
        ) : null}
      </div>
    </FadeIn>
  );
}
