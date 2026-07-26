"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { PhosphorIcon } from "@/components/icons/phosphor-icon"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <PhosphorIcon name="CircleCheckIcon" className="size-4" />
        ),
        info: (
          <PhosphorIcon name="InfoIcon" className="size-4" />
        ),
        warning: (
          <PhosphorIcon name="TriangleAlertIcon" className="size-4" />
        ),
        error: (
          <PhosphorIcon name="OctagonXIcon" className="size-4" />
        ),
        loading: (
          <PhosphorIcon name="Loader2Icon" className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
