"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Building2, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Org = { id: string; name: string };

export function OrgSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/user/orgs");
        if (res.ok) {
          const data = await res.json();
          setOrgs(data.orgs ?? []);
          setCurrentOrg(data.currentOrg ?? null);
        }
      } catch {
        // API not available — hide switcher
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const switchOrg = (orgId: string) => {
    const remaining = pathname.replace(/^\/org\/[^/]+/, "") || "/admin";
    router.push(`/org/${orgId}${remaining}`);
    setOpen(false);
  };

  if (loading || orgs.length <= 1) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors focus-ring"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Building2 className="h-4 w-4 shrink-0" />
        <span className="max-w-[120px] truncate">{currentOrg?.name ?? "Select org"}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full mt-1.5 w-56 rounded-xl border border-border bg-popover p-1 shadow-lg z-50"
        >
          {orgs.map((org) => (
            <button
              key={org.id}
              role="option"
              aria-selected={org.id === currentOrg?.id}
              onClick={() => switchOrg(org.id)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              {org.name}
              {org.id === currentOrg?.id && (
                <Check className="h-3.5 w-3.5 text-brand" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}