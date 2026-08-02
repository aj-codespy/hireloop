import { DbSyncBanner } from "@/components/admin/db-sync-banner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DbSyncBanner />
      {children}
    </>
  );
}
