"use client"

import * as React from "react"
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { cn } from "@/lib/utils"

type ToggleGroupProps = {
  type?: "single" | "multiple"
  value?: string | string[]
  defaultValue?: string | string[]
  onValueChange?: (value: string) => void
  className?: string
  disabled?: boolean
  orientation?: "horizontal" | "vertical"
  loopFocus?: boolean
  children?: React.ReactNode
}

function ToggleGroup({
  type = "single",
  value: valueProp,
  defaultValue: defaultValueProp,
  onValueChange,
  className,
  ...props
}: ToggleGroupProps) {
  // Convert Radix-style single-string value to Base UI string[]
  const baseValue = React.useMemo(() => {
    if (valueProp === undefined) return undefined
    return Array.isArray(valueProp) ? valueProp : [valueProp]
  }, [valueProp])

  const baseDefaultValue = React.useMemo(() => {
    if (defaultValueProp === undefined) return undefined
    return Array.isArray(defaultValueProp) ? defaultValueProp : [defaultValueProp]
  }, [defaultValueProp])

  const handleValueChange = React.useCallback(
    (newValue: string[], _eventDetails: unknown) => {
      if (type === "single") {
        onValueChange?.(newValue[0] ?? "")
      } else {
        onValueChange?.(newValue.join(","))
      }
    },
    [onValueChange, type],
  )

  return (
    <ToggleGroupPrimitive
      value={baseValue as string[] | undefined}
      defaultValue={baseDefaultValue as string[] | undefined}
      onValueChange={handleValueChange}
      className={cn(className)}
      {...props}
    />
  )
}

function ToggleGroupItem({
  value,
  className,
  children,
  ...props
}: {
  value: string
  className?: string
  children?: React.ReactNode
} & Omit<React.ComponentPropsWithoutRef<typeof TogglePrimitive>, "value">) {
  return (
    <TogglePrimitive
      value={value}
      className={cn(className)}
      {...props}
    >
      {children}
    </TogglePrimitive>
  )
}

export { ToggleGroup, ToggleGroupItem }
