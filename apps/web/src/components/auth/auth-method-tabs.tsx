"use client";

import { Button } from "@/components/ui/button";

export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="relative my-4">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-2 text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

export function AuthMethodTabs({
  method,
  onChange,
}: {
  method: "password" | "otp";
  onChange: (method: "password" | "otp") => void;
}) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-[#FAFAF9] p-1" role="tablist" aria-label="Authentication method">
      <Button
        type="button"
        role="tab"
        aria-selected={method === "password"}
        variant={method === "password" ? "default" : "ghost"}
        className="h-11 rounded-full data-[selected=true]:bg-white"
        onClick={() => onChange("password")}
      >
        Password
      </Button>
      <Button
        type="button"
        role="tab"
        aria-selected={method === "otp"}
        variant={method === "otp" ? "default" : "ghost"}
        className="h-11 rounded-full data-[selected=true]:bg-white"
        onClick={() => onChange("otp")}
      >
        Email code
      </Button>
    </div>
  );
}
