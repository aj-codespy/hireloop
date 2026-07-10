"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { getAdminRouteMeta } from "@/lib/navigation/admin-routes";
import { useOrgPermissions } from "@/hooks/use-org-permissions";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";

export function AppHeader({
  showSearch = true,
  showCreateJob = true,
}: {
  showSearch?: boolean;
  showCreateJob?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const meta = getAdminRouteMeta(pathname);
  const { canManageJobs } = useOrgPermissions();
  const [query, setQuery] = useState("");

  function submitSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) router.push(`/admin/people-search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-6">
      <div className="min-w-0 flex-1">
        {pathname === "/admin" && meta ? (
          <div>
            <h1 className="truncate text-lg font-semibold text-foreground">{meta.title}</h1>
            <p className="truncate text-xs text-muted-foreground">{meta.description}</p>
          </div>
        ) : showSearch ? (
          <form onSubmit={submitSearch} className="relative w-full max-w-md">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search candidates…"
              aria-label="Search candidates"
              className="h-9 rounded-full border-border bg-muted/50 pl-9 shadow-none focus-visible:ring-brand"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 text-[10px] text-muted-foreground sm:inline">
              ⌘K
            </span>
          </form>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {showCreateJob && canManageJobs ? (
          <ButtonLink
            href="/admin/jobs/new"
            className="h-9 gap-1.5 rounded-full bg-brand px-4 text-brand-foreground shadow-sm hover:bg-brand/90"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Create job
          </ButtonLink>
        ) : null}
      </div>
    </header>
  );
}
