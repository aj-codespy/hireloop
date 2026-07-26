import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";

export function AppBreadcrumbs({
  items,
  className,
}: {
  items: { label: string; href?: string }[];
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <Breadcrumb className={cn("mb-0", className)}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            render={<Link href="/admin" />}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        {items.map((item, i) => (
          <BreadcrumbItem key={`${item.label}-${i}`}>
            <BreadcrumbSeparator>
              <PhosphorIcon name="ChevronRight" className="h-3.5 w-3.5" />
            </BreadcrumbSeparator>
            {item.href && i < items.length - 1 ? (
              <BreadcrumbLink
                render={<Link href={item.href} />}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage>{item.label}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}