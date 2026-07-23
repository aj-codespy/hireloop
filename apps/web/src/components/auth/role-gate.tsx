"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOrgPermissions } from "@/hooks/use-org-permissions";

type MinRole = "admin" | "recruiter" | "viewer";

const ROLE_HIERARCHY: Record<string, number> = {
  viewer: 0,
  recruiter: 1,
  admin: 2,
};

export function RoleGate({
  children,
  minRole = "admin",
  fallbackHref = "/admin",
}: {
  children: React.ReactNode;
  minRole?: MinRole;
  fallbackHref?: string;
}) {
  const router = useRouter();
  const { role, loading } = useOrgPermissions();

  useEffect(() => {
    if (loading) return;
    if (!role || (ROLE_HIERARCHY[role] ?? -1) < ROLE_HIERARCHY[minRole]) {
      router.replace(fallbackHref);
    }
  }, [role, loading, minRole, fallbackHref, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12" role="status">
        <p className="text-sm text-muted-foreground animate-pulse">Checking permissions…</p>
      </div>
    );
  }

  if (!role || (ROLE_HIERARCHY[role] ?? -1) < ROLE_HIERARCHY[minRole]) {
    return null;
  }

  return <>{children}</>;
}