"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import { FadeIn } from "@/components/motion/fade-in";
import { useHireLoop } from "@/lib/store/provider";
import { APPLICATION_STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

function searchableText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return "";
  return String(value).toLowerCase();
}

export default function PeopleSearchPage() {
  const { state, hydrated } = useHireLoop();
  const [query, setQuery] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("q") ?? "";
  });

  const rows = useMemo(() => {
    return state.candidates.map((candidate) => {
      const application = state.applications.find((a) => a.candidateId === candidate.id);
      const job = application
        ? state.jobs.find((j) => j.id === application.jobRoleId)
        : undefined;
      return { candidate, application, job };
    });
  }, [state.candidates, state.applications, state.jobs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter(({ candidate, application, job }) => {
      const statusLabel = application
        ? APPLICATION_STATUS_LABELS[application.status].toLowerCase()
        : "";
      const formText = application
        ? Object.values(application.formResponse).map(searchableText).join(" ")
        : "";

      const haystack = [
        candidate.name,
        candidate.email,
        candidate.phone ?? "",
        candidate.source,
        job?.title ?? "",
        statusLabel,
        formText,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [query, rows]);

  if (!hydrated) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <FadeIn className="mx-auto max-w-3xl space-y-6">
      <header className="border-b border-slate-200 pb-6">
        <h1>People search</h1>
        <p className="mt-2 text-sm text-slate-600">
          Search your talent pool by name, email, job, or stage.
        </p>
      </header>

      <div className="relative">
        <PhosphorIcon name="Search" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <label htmlFor="people-search" className="sr-only">
          Search people
        </label>
        <Input
          id="people-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, job, or status..."
          className="h-12 rounded-full border-border bg-card pl-12 text-base shadow-card"
          autoFocus
        />
      </div>

      <p className="text-sm text-muted-foreground">
                    {filtered.length} of {rows.length} people
                    {query.trim() ? ` matching &ldquo;${query.trim()}&rdquo;` : ""}
                  </p>

      <div className="divide-y divide-slate-200 border-y border-slate-200">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <PhosphorIcon name="Users" className="h-6 w-6 text-muted-foreground" />
            </div>
            {query.trim() ? (
              <>
                <p className="font-medium">No matches for &ldquo;{query.trim()}&rdquo;</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try searching by name, email, job title, or application status.
                </p>
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="mt-4 text-sm font-medium text-brand hover:underline focus-ring rounded-sm"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <p className="font-medium">No candidates yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create a job and share the apply link to start building your pipeline.
                </p>
              </>
            )}
          </div>
        ) : (
          filtered.map(({ candidate, application, job }) => (
            <Link key={candidate.id} href={`/admin/candidates/${candidate.id}`}>
              <Card className="rounded-none border-0 bg-transparent transition-colors duration-200 hover:bg-slate-50 motion-reduce:transition-none">
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-brand-muted text-brand">
                        {candidate.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{candidate.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{candidate.email}</p>
                      {job ? (
                        <p className="truncate text-xs text-muted-foreground">{job.title}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {application ? (
                      <Badge className={STATUS_COLORS[application.status]}>
                        {APPLICATION_STATUS_LABELS[application.status]}
                      </Badge>
                    ) : null}
                    <Badge variant="secondary" className="capitalize">
                      {candidate.source}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </FadeIn>
  );
}
