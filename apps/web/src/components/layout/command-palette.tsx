"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const actions = [
  { id: "new-job", label: "Create a job", href: "/admin/jobs/new", icon: "Plus" },
  { id: "candidates", label: "View candidates", href: "/admin/candidates", icon: "Users" },
  { id: "dashboard", label: "Go to dashboard", href: "/admin", icon: "LayoutDashboard" },
  { id: "jobs", label: "Manage jobs", href: "/admin/jobs", icon: "Briefcase" },
  { id: "reports", label: "View reports", href: "/admin/reports", icon: "ChartBar" },
  { id: "scheduling", label: "Scheduling", href: "/admin/scheduling", icon: "Calendar" },
  { id: "webhooks", label: "Webhooks", href: "/admin/webhooks", icon: "Webhook" },
  { id: "settings", label: "Settings", href: "/admin/settings", icon: "Settings" },
  { id: "company", label: "Company profile", href: "/admin/company", icon: "Building" },
  { id: "search-people", label: "People search", href: "/admin/people-search", icon: "Search" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      const action = actions.find((a) => a.id === id);
      if (action) {
        setOpen(false);
        router.push(action.href);
      }
    },
    [router]
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search actions, pages, tools…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick actions">
          {actions.map((action) => (
            <CommandItem key={action.id} value={action.id} onSelect={handleSelect}>
              <PhosphorIcon name={action.icon as any} className="h-4 w-4" />
              <span>{action.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}