import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  hint,
  icon,
  href,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  href?: string;
  className?: string;
}) {
  const inner = (
    <Card className={cn("border-border bg-surface-elevated interactive-card", className)}>
      <CardContent className="flex items-start gap-4 p-5">
        {icon ? (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-muted text-brand">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <p className="text-caption font-medium uppercase tracking-wide">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{value}</p>
          {hint ? <p className="mt-1 text-caption">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-ring rounded-xl">
        {inner}
      </Link>
    );
  }

  return inner;
}
