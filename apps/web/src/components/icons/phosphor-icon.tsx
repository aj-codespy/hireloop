"use client";

import * as PhosphorIcons from "@phosphor-icons/react";
import { ICON_MAP, type LucideIconName } from "./icon-map";
import { cn } from "@/lib/utils";
import { iconTokens } from "@/lib/design-tokens";

interface PhosphorIconProps {
  name: LucideIconName;
  className?: string;
  size?: keyof typeof iconTokens.sizes | number;
  weight?: typeof iconTokens.weights[number];
  "aria-hidden"?: boolean;
}

export function PhosphorIcon({
  name,
  className,
  size = "md",
  weight = iconTokens.defaultWeight,
  "aria-hidden": ariaHidden = true,
  ...props
}: PhosphorIconProps) {
  const phosphorName = ICON_MAP[name];
  const IconComponent = PhosphorIcons[phosphorName as keyof typeof PhosphorIcons] as React.ComponentType<any>;

  if (!IconComponent) {
    console.warn(`Phosphor icon not found for Lucide name: ${name}, mapped to: ${phosphorName}`);
    return null;
  }

  const iconSize = typeof size === "number" ? size : iconTokens.sizes[size];

  return (
    <IconComponent
      className={cn("shrink-0", className)}
      size={iconSize}
      weight={weight}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}