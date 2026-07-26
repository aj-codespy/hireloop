import Link from "next/link";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/brand/logo-mark";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";

export function Logo({
  className,
  href = "/",
  showText = true,
  variant = "full",
  size = "default",
}: {
  className?: string;
  href?: string;
  showText?: boolean;
  variant?: "full" | "mark";
  size?: "sm" | "default" | "lg";
}) {
  const markSize = size === "sm" ? 28 : size === "lg" ? 40 : 36;
  const textClass =
    size === "sm" ? "text-base" : size === "lg" ? "text-xl" : "text-lg";

  const content = (
    <>
      <LogoMark size={markSize} />
      {showText && variant === "full" ? (
        <span className={cn("font-semibold tracking-tight text-foreground", textClass)}>
          Hire<span className="text-brand">Loop</span>
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn("flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-lg", className)}
        aria-label="HireLoop home"
      >
        {content}
      </Link>
    );
  }

  return <div className={cn("flex items-center gap-2.5", className)}>{content}</div>;
}
