import { APPLICATION_STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";
import type { ApplicationStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
}: {
  status: ApplicationStatus | string;
  className?: string;
}) {
  const label =
    status in APPLICATION_STATUS_LABELS
      ? APPLICATION_STATUS_LABELS[status as ApplicationStatus]
      : String(status);
  const colors =
    status in STATUS_COLORS ? STATUS_COLORS[status as ApplicationStatus] : "bg-muted text-muted-foreground";

  return (
    <Badge className={cn(colors, className)} aria-label={`Status: ${label}`}>
      {label}
    </Badge>
  );
}
