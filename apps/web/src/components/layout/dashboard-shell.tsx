import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AdminPageFrame } from "@/components/layout/admin-page-frame";

export function DashboardShell({
  children,
  showSearch = true,
  showCreateJob = true,
}: {
  children: React.ReactNode;
  showSearch?: boolean;
  showCreateJob?: boolean;
}) {
  return (
    <div className="flex h-dvh overflow-hidden bg-muted/30">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader showSearch={showSearch} showCreateJob={showCreateJob} />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 scroll-pt-6 overflow-y-auto overscroll-contain px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-6 lg:px-8"
        >
          <AdminPageFrame>{children}</AdminPageFrame>
        </main>
      </div>
    </div>
  );
}
