"use client";

import { usePathname } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname === "/admin/login";

  if (isAuth) {
    return <>{children}</>;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
