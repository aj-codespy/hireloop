"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import {
  IconCandidates,
  IconCompany,
  IconCompliance,
  IconDashboard,
  IconJobBoard,
  IconOffers,
  IconPeopleSearch,
  IconReports,
  IconRequisitions,
  IconScheduling,
  IconSettings,
} from "@/components/icons/brand-icons";
import { useOrgPermissions } from "@/hooks/use-org-permissions";
import { roleLabel } from "@/lib/auth/permissions";
import { useHireLoop } from "@/lib/store/provider";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  managersOnly?: boolean;
};

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Hire",
    items: [
      { href: "/admin", label: "Dashboard", icon: IconDashboard, exact: true },
      { href: "/admin/jobs", label: "Jobs", icon: IconJobBoard },
      { href: "/admin/candidates", label: "Candidates", icon: IconCandidates },
    ],
  },
  {
    label: "Decide",
    items: [
      { href: "/admin/requisitions", label: "Requisitions", icon: IconRequisitions, managersOnly: true },
      { href: "/admin/scheduling", label: "Scheduling", icon: IconScheduling },
      { href: "/admin/offers", label: "Offers", icon: IconOffers, managersOnly: true },
      { href: "/admin/people-search", label: "People search", icon: IconPeopleSearch },
      { href: "/admin/reports", label: "Reports", icon: IconReports },
    ],
  },
  {
    label: "Organization",
    items: [
      { href: "/admin/compliance", label: "Compliance", icon: IconCompliance, managersOnly: true },
      { href: "/admin/company", label: "Company", icon: IconCompany, managersOnly: true },
      { href: "/admin/settings", label: "Settings", icon: IconSettings, managersOnly: true },
    ],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { state } = useHireLoop();
  const { role, canManageOrg } = useOrgPermissions();

  return (
    <>
      <div className="border-b border-sidebar-border px-5 py-5">
        <Logo href="/admin" size="sm" />
        <p className="mt-3 truncate text-xs font-medium text-muted-foreground">
          {state.organization.name}
        </p>
        {role ? (
          <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground/70">
            {roleLabel(role)}
          </p>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4" aria-label="Admin">
        {navGroups.map((group) => {
          const items = group.items.filter((item) => !item.managersOnly || canManageOrg);
          if (items.length === 0) return null;
          return (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {items.map((item) => {
                  const active = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-[color,background-color] duration-250 ease-out focus-ring motion-reduce:transition-none",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-muted-foreground hover:bg-card hover:text-foreground"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      {active ? (
                        <span
                          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand"
                          aria-hidden
                        />
                      ) : null}
                      <Icon
                        className={cn(
                          "h-[18px] w-[18px] shrink-0",
                          active ? "text-brand" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="flex items-center justify-between border-t border-sidebar-border px-4 py-3">
        <ModeToggle />
        <form action={signOutAction}>
          <Button type="submit" variant="ghost" size="sm" className="text-xs text-muted-foreground">
            Sign out
          </Button>
        </form>
      </div>
    </>
  );
}

export function AppSidebar() {
  return (
    <aside className="hidden h-full w-[248px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <SidebarContent />
    </aside>
  );
}

export function MobileAppSidebar() {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Tooltip>
        <SheetTrigger
          render={
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open navigation"
                />
              }
            >
              <PhosphorIcon name="List" aria-hidden />
            </TooltipTrigger>
          }
        />
        <TooltipContent side="right">Navigation menu</TooltipContent>
      </Tooltip>
      <SheetContent
        side="left"
        className="w-[min(88vw,320px)] gap-0 bg-sidebar p-0 text-sidebar-foreground"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Admin navigation</SheetTitle>
          <SheetDescription>Navigate the HireLoop workspace</SheetDescription>
        </SheetHeader>
        <SidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
