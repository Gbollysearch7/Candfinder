"use client";

import { useWebsetStore } from "@/stores/webset-store";
import { useUiStore } from "@/stores/ui-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap } from "lucide-react";

// Color bars for criteria — cycle through these
const CRITERION_COLORS = [
  "bg-electric",
  "bg-accent-green",
  "bg-accent-amber",
  "bg-mystic",
  "bg-accent-red",
  "bg-accent-blue",
];

const ENRICHMENT_PRESETS = [
  { label: "Email", description: "Find the person's email address", format: "email" as const },
  { label: "Interests", description: "What are this person's professional interests?", format: "text" as const },
  { label: "Seniority", description: "What is this person's seniority level?", format: "text" as const },
  { label: "Skills", description: "What are this person's key skills?", format: "text" as const },
];

export function CriteriaPanel() {
  const activeWebset = useWebsetStore((s) => s.activeWebset);
  const { setAddColumnOpen } = useUiStore();

  const search = activeWebset?.searches?.[0];
  const query = search?.query ?? "";
  const criteria = search?.criteria ?? [];
  const enrichments = activeWebset?.enrichments ?? [];

  if (!activeWebset) return null;

  return (
    <aside className="w-[280px] h-full border-l border-border bg-surface-solid flex flex-col shrink-0">
      <ScrollArea className="flex-1">
        <div className="p-5">
          {/* Criteria Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Criteria
              </h3>
              <span className="text-[10px] text-muted-foreground">
                People
              </span>
            </div>

            {/* Query box */}
            {query && (
              <div className="p-3 rounded-lg bg-electric/10 border border-electric/20 mb-4">
                <p className="text-xs text-electric leading-relaxed">{query}</p>
              </div>
            )}

            {/* Criteria list with colored bars */}
            {criteria.length > 0 && (
              <div className="space-y-2.5">
                {criteria.map((criterion, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div
                      className={`w-1 self-stretch rounded-full shrink-0 ${CRITERION_COLORS[i % CRITERION_COLORS.length]}`}
                    />
                    <p className="text-xs text-foreground/80 leading-relaxed">
                      {criterion.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {criteria.length === 0 && (
              <p className="text-xs text-muted-foreground/50">No criteria defined</p>
            )}
          </div>

          {/* Enrichments Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Enrichments
              </h3>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {enrichments.length} / row
              </span>
            </div>

            {/* Quick-add enrichment tags */}
            <div className="flex flex-wrap gap-1.5">
              {ENRICHMENT_PRESETS.map((preset) => {
                const alreadyAdded = enrichments.some(
                  (e) => e.description.toLowerCase() === preset.description.toLowerCase()
                );
                return (
                  <button
                    key={preset.label}
                    onClick={() => {
                      if (!alreadyAdded) {
                        setAddColumnOpen(true);
                      }
                    }}
                    disabled={alreadyAdded}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      alreadyAdded
                        ? "bg-surface-elevated border-border text-muted-foreground/40 cursor-default"
                        : "bg-surface-elevated border-border text-foreground/70 hover:border-primary/30 hover:text-primary cursor-pointer"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
              <button
                onClick={() => setAddColumnOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-dashed border-border text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
              >
                + Custom
              </button>
            </div>

            {/* Currently active enrichments */}
            {enrichments.length > 0 && (
              <div className="mt-4 space-y-1.5">
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium">
                  Active
                </p>
                {enrichments.map((enrichment) => (
                  <div
                    key={enrichment.id}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-surface border border-border"
                  >
                    <Zap className="h-3 w-3 text-primary shrink-0" />
                    <span className="text-[11px] text-foreground/70 truncate">
                      {enrichment.description.slice(0, 35)}
                    </span>
                    <span className={`ml-auto text-[9px] font-medium px-1.5 py-0.5 rounded ${
                      enrichment.status === "completed"
                        ? "bg-accent-green/15 text-accent-green"
                        : enrichment.status === "running"
                          ? "bg-electric/15 text-electric"
                          : "bg-muted-foreground/15 text-muted-foreground"
                    }`}>
                      {enrichment.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
