import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button-link";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/logo-mark";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  illustration,
  className,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  illustration?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--radius-dashboard)] border border-dashed border-border bg-muted/30 px-6 py-14 text-center",
        className
      )}
    >
      <div className="mb-4 opacity-40">
        {illustration ?? <LogoMark size={48} />}
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {actionLabel && (actionHref || onAction) ? (
        <div className="mt-6">
          {actionHref ? (
            <ButtonLink href={actionHref}>
              {actionLabel}
            </ButtonLink>
          ) : (
            <Button
              type="button"
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
