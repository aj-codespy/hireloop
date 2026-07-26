"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import { getAdminRouteMeta } from "@/lib/navigation/admin-routes";
import { useOrgPermissions } from "@/hooks/use-org-permissions";
import { ButtonLink } from "@/components/ui/button-link";
import { OrgSwitcher } from "@/components/layout/org-switcher";
import { MobileAppSidebar } from "@/components/layout/app-sidebar";
import { CommandPalette } from "@/components/layout/command-palette";

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
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  function submitSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) router.push(`/admin/people-search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <header className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-3 pt-[env(safe-area-inset-top)] sm:px-5 lg:px-6">
      <MobileAppSidebar />
      <div className="min-w-0 flex-1">
        {pathname === "/admin" && meta ? (
          <div>
            <h1 className="truncate text-lg font-semibold text-foreground">{meta.title}</h1>
            <p className="truncate text-xs text-muted-foreground">{meta.description}</p>
          </div>
        ) : showSearch ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-10 w-full max-w-md items-center gap-2 rounded-full border border-border bg-muted/50 px-4 text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-brand sm:block"
          >
            <PhosphorIcon name="Search" className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Search candidates…</span>
            <span className="pointer-events-none ml-auto text-[10px] text-muted-foreground">⌘K</span>
          </button>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <OrgSwitcher />
        {showCreateJob && canManageJobs ? (
          <ButtonLink
            href="/admin/jobs/new"
            aria-label="Create job"
            className="h-10 gap-1.5 bg-brand px-4 text-brand-foreground shadow-sm hover:bg-[#ea6b2d]"
          >
            <PhosphorIcon name="Plus" />
            <span className="hidden sm:inline">Create job</span>
          </ButtonLink>
        ) : null}
      </div>
      <CommandPalette />
    </header>
  );
}
