"use client";

import Link from "next/link";
import { Plus, CheckCircle2, XCircle, LayoutGrid, List } from "lucide-react";
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
    localStorage.setItem(VIEW_KEY, next);
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

  if (!hydrated) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <FadeIn className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <Input
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
          <div className="flex rounded-full border border-border bg-card p-0.5" role="group" aria-label="View mode">
            <Button
              type="button"
              size="sm"
              variant={view === "table" ? "default" : "ghost"}
              className={cn("h-8 rounded-full px-3", view === "table" && "bg-brand text-brand-foreground hover:bg-brand/90")}
              onClick={() => switchView("table")}
              aria-pressed={view === "table"}
            >
              <List className="mr-1 h-4 w-4" aria-hidden />
              Table
            </Button>
            <Button
              type="button"
              size="sm"
              variant={view === "board" ? "default" : "ghost"}
              className={cn("h-8 rounded-full px-3", view === "board" && "bg-brand text-brand-foreground hover:bg-brand/90")}
              onClick={() => switchView("board")}
              aria-pressed={view === "board"}
            >
              <LayoutGrid className="mr-1 h-4 w-4" aria-hidden />
              Board
            </Button>
          </div>
          <ButtonLink href="/admin/jobs/new" className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
          <Plus className="mr-1 h-4 w-4" />
          Create job
        </ButtonLink>
        </div>
      </div>

      {view === "board" ? <InterviewPipeline /> : null}

      {view === "table" ? (
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Job</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Shortlisted</TableHead>
              <TableHead>Interview done</TableHead>
              <TableHead>Applied</TableHead>
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
                      <Link href={`/admin/candidates/${candidate.id}`} className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-brand-muted text-xs text-brand">
                            {initials(candidate.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium hover:text-brand">{candidate.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{candidate.email}</TableCell>
                    <TableCell className="max-w-[160px] truncate">{job?.title}</TableCell>
                    <TableCell>
                      <StatusBadge status={application.status} />
                    </TableCell>
                    <TableCell>
                      {shortlisted ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                    </TableCell>
                    <TableCell>
                      {interviewed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <span className="text-xs text-muted-foreground">Pending</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(application.createdAt)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      ) : null}
      <p className="text-right text-sm text-muted-foreground">
        Showing {filtered.length} application{filtered.length !== 1 ? "s" : ""}
      </p>
    </FadeIn>
  );
}
