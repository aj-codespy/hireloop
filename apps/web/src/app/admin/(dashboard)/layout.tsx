import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SidebarIndicatorAnimations, ChartTooltipAnimations } from "@/components/animations/dashboard-animations";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell>
      <SidebarIndicatorAnimations />
      <ChartTooltipAnimations />
      <main
        className={[
          "admin-workspace min-w-0 font-sans text-slate-950",
          "[&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-[-0.02em]",
          "[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-[-0.02em]",
          "[&_h3]:tracking-[-0.01em]",
          "[&_[data-slot=card]]:rounded-2xl [&_[data-slot=card]]:border-slate-200/80",
          "[&_[data-slot=card]]:shadow-none",
          "[&_[data-slot=input]]:rounded-xl [&_[data-slot=input]]:border-slate-200",
          "[&_[data-slot=table-container]]:max-w-full [&_[data-slot=table-container]]:overflow-x-auto",
          "[&_[data-slot=table-head]]:whitespace-nowrap [&_[data-slot=table-head]]:text-xs",
          "[&_[data-slot=table-cell]]:align-middle",
          "[&_button]:transition-colors [&_button]:duration-200 motion-reduce:[&_button]:transition-none",
          "[&_a]:transition-colors [&_a]:duration-200 motion-reduce:[&_a]:transition-none",
          "[&_.tabular-nums]:font-mono",
        ].join(" ")}
      >
        {children}
      </main>
    </DashboardShell>
  );
}
