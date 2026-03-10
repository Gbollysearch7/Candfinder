"use client";

import { useWebsetStore } from "@/stores/webset-store";
import { Button } from "@/components/ui/button";
import { Search, Users, Lightbulb } from "lucide-react";

const TIPS = [
  "Use broader role descriptions like \"engineer\" instead of \"senior ML engineer\"",
  "Try different locations — \"US-based\" instead of a specific city",
  "Remove overly specific criteria to widen the candidate pool",
  "Search for the company or industry instead of a specific title",
];

export function TableEmptyState() {
  const clearActiveWebset = useWebsetStore((s) => s.clearActiveWebset);
  const activeWebset = useWebsetStore((s) => s.activeWebset);
  const query = activeWebset?.searches?.[0]?.query ?? "";

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex items-center justify-center gap-2 mb-5">
        <div className="h-12 w-12 rounded-xl bg-surface-elevated flex items-center justify-center border border-border">
          <Search className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="h-12 w-12 rounded-xl bg-surface-elevated flex items-center justify-center border border-border">
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>

      <h3 className="text-base font-semibold mb-2 text-foreground">No candidates found</h3>

      {query && (
        <p className="text-xs text-muted-foreground text-center max-w-sm mb-6">
          Your search for &ldquo;{query.slice(0, 60)}{query.length > 60 ? "..." : ""}&rdquo; didn&apos;t return any results.
        </p>
      )}

      {/* Tips */}
      <div className="w-full max-w-sm mb-6">
        <div className="flex items-center gap-1.5 mb-3">
          <Lightbulb className="h-3.5 w-3.5 text-accent-amber" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            Tips to improve results
          </span>
        </div>
        <ul className="space-y-2">
          {TIPS.map((tip, i) => (
            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="text-muted-foreground/40 mt-0.5">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-xs border-border"
          onClick={clearActiveWebset}
        >
          New search
        </Button>
      </div>
    </div>
  );
}
