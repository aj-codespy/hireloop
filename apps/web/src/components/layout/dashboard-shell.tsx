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
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader showSearch={showSearch} showCreateJob={showCreateJob} />
        <main className="flex-1 overflow-y-auto p-6">
          <AdminPageFrame>{children}</AdminPageFrame>
        </main>
      </div>
    </div>
  );
}
