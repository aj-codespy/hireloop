"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">People search</h1>
        <p className="text-sm text-muted-foreground">
          Search your talent pool by name, email, job, or stage.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, job, or status..."
          className="h-12 rounded-full border-border bg-card pl-12 text-base shadow-card"
          autoFocus
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} of {rows.length} people
        {query.trim() ? ` matching “${query.trim()}”` : ""}
      </p>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {query.trim() ? "No matches. Try a different search." : "No candidates yet."}
          </p>
        ) : (
          filtered.map(({ candidate, application, job }) => (
            <Link key={candidate.id} href={`/admin/candidates/${candidate.id}`}>
              <Card className="border-border shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
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
