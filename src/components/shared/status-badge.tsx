"use client";

import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { color: string; label: string; pulse: boolean }> = {
  pending: { color: "bg-accent-amber", label: "Starting...", pulse: true },
  running: { color: "bg-accent-amber", label: "Running", pulse: true },
  active: { color: "bg-accent-amber", label: "Active", pulse: true },
  idle: { color: "bg-accent-green", label: "Complete", pulse: false },
  completed: { color: "bg-accent-green", label: "Complete", pulse: false },
  canceled: { color: "bg-muted-foreground", label: "Cancelled", pulse: false },
  paused: { color: "bg-muted-foreground", label: "Paused", pulse: false },
  failed: { color: "bg-accent-red", label: "Failed", pulse: false },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.idle;

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11px]", className)}>
      <span className="relative flex h-1.5 w-1.5">
        {config.pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
              config.color
            )}
          />
        )}
        <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", config.color)} />
      </span>
      <span className="text-muted-foreground">{config.label}</span>
    </span>
  );
}
