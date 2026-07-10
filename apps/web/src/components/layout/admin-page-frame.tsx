"use client";

import { usePathname } from "next/navigation";
import { getAdminRouteMeta } from "@/lib/navigation/admin-routes";
import { AppBreadcrumbs } from "@/components/layout/app-breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { PageTransition } from "@/components/motion/interactions";

export function AdminPageFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const meta = getAdminRouteMeta(pathname);

  if (!meta) {
    return (
      <PageTransition className="mx-auto w-full max-w-[1440px]">{children}</PageTransition>
    );
  }

  return (
    <PageTransition className="mx-auto w-full max-w-[1440px] space-y-6">
      {meta.breadcrumbs ? <AppBreadcrumbs items={meta.breadcrumbs} /> : null}
      {pathname !== "/admin" ? (
        <PageHeader title={meta.title} description={meta.description} />
      ) : null}
      {children}
    </PageTransition>
  );
}
