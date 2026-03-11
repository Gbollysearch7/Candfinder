"use client";

import { useState } from "react";
import { useWebsetStore } from "@/stores/webset-store";
import { useUiStore } from "@/stores/ui-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createSearch } from "@/lib/api-client";
import { Zap, Plus, Loader2, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";

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
  const activeWebsetId = useWebsetStore((s) => s.activeWebsetId);
  const addSearch = useWebsetStore((s) => s.addSearch);
  const items = useWebsetStore((s) => s.items);
  const { setAddColumnOpen } = useUiStore();

  const [newCriterion, setNewCriterion] = useState("");
  const [addedCriteria, setAddedCriteria] = useState<string[]>([]);
  const [removedCriteria, setRemovedCriteria] = useState<Set<string>>(new Set());
  const [isRefining, setIsRefining] = useState(false);

  const search = activeWebset?.searches?.[0];
  const query = search?.query ?? "";
  const criteria = search?.criteria ?? [];
  const enrichments = activeWebset?.enrichments ?? [];
  const isRunning = activeWebset?.status === "running" || activeWebset?.status === "pending";

  // Effective criteria = original minus removed plus added
  const effectiveCriteria = [
    ...criteria.filter((c) => !removedCriteria.has(c.description)),
    ...addedCriteria.map((d) => ({ description: d })),
  ];

  const hasChanges = addedCriteria.length > 0 || removedCriteria.size > 0;

  const handleAddCriterion = () => {
    const trimmed = newCriterion.trim();
    if (!trimmed) return;
    if (addedCriteria.includes(trimmed)) return;
    setAddedCriteria((prev) => [...prev, trimmed]);
    setNewCriterion("");
  };

  const handleRemoveCriterion = (description: string) => {
    // If it's a newly added one, just remove from addedCriteria
    if (addedCriteria.includes(description)) {
      setAddedCriteria((prev) => prev.filter((c) => c !== description));
    } else {
      // It's an original criterion — mark as removed
      setRemovedCriteria((prev) => new Set([...prev, description]));
    }
  };

  const handleRestoreCriterion = (description: string) => {
    setRemovedCriteria((prev) => {
      const next = new Set(prev);
      next.delete(description);
      return next;
    });
  };

  const handleRefineSearch = async () => {
    if (!activeWebsetId || !query || !hasChanges || isRunning) return;
    setIsRefining(true);
    try {
      const newSearch = await createSearch(activeWebsetId, {
        query,
        entity: { type: "person" },
        criteria: effectiveCriteria.map((c) => ({ description: c.description })),
        count: items.length > 0 ? Math.max(items.length, 25) : 25,
        behavior: "override",
      });
      addSearch(newSearch);
      // Reset edit state
      setAddedCriteria([]);
      setRemovedCriteria(new Set());
      toast.success("Re-evaluating with updated criteria...");
    } catch (err) {
      toast.error("Failed to refine search");
      console.error("Refine error:", err);
    } finally {
      setIsRefining(false);
    }
  };

  const handleDiscardChanges = () => {
    setAddedCriteria([]);
    setRemovedCriteria(new Set());
    setNewCriterion("");
  };

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

            {/* Criteria list with colored bars + remove buttons */}
            {criteria.length > 0 && (
              <div className="space-y-2">
                {criteria.map((criterion, i) => {
                  const isRemoved = removedCriteria.has(criterion.description);
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-2 group ${isRemoved ? "opacity-40" : ""}`}
                    >
                      <div
                        className={`w-1 self-stretch rounded-full shrink-0 ${
                          isRemoved ? "bg-muted-foreground/30" : CRITERION_COLORS[i % CRITERION_COLORS.length]
                        }`}
                      />
                      <p className={`text-xs leading-relaxed flex-1 ${
                        isRemoved ? "line-through text-muted-foreground" : "text-foreground/80"
                      }`}>
                        {criterion.description}
                        {criterion.successRate != null && (
                          <span className="ml-1.5 text-[10px] text-muted-foreground tabular-nums">
                            {Math.round(criterion.successRate * 100)}%
                          </span>
                        )}
                      </p>
                      {isRemoved ? (
                        <button
                          onClick={() => handleRestoreCriterion(criterion.description)}
                          className="text-[10px] text-electric hover:text-electric/80 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Undo
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRemoveCriterion(criterion.description)}
                          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-accent-red" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Newly added criteria */}
            {addedCriteria.length > 0 && (
              <div className="space-y-2 mt-2 pt-2 border-t border-dashed border-accent-green/30">
                {addedCriteria.map((description, i) => (
                  <div key={`new-${i}`} className="flex items-start gap-2 group">
                    <div className="w-1 self-stretch rounded-full shrink-0 bg-accent-green" />
                    <p className="text-xs text-accent-green leading-relaxed flex-1">
                      {description}
                    </p>
                    <button
                      onClick={() => handleRemoveCriterion(description)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-accent-red" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new criterion input */}
            <div className="mt-3 flex items-center gap-1.5">
              <input
                type="text"
                value={newCriterion}
                onChange={(e) => setNewCriterion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCriterion();
                }}
                placeholder="Add criterion..."
                className="flex-1 px-2.5 py-1.5 rounded-md text-xs bg-surface-elevated border border-border text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40 transition-colors"
              />
              <button
                onClick={handleAddCriterion}
                disabled={!newCriterion.trim()}
                className="p-1.5 rounded-md bg-surface-elevated border border-border text-muted-foreground hover:text-primary hover:border-primary/30 disabled:opacity-30 transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            {/* Apply changes button */}
            {hasChanges && (
              <div className="mt-3 space-y-1.5">
                <button
                  onClick={handleRefineSearch}
                  disabled={isRefining || isRunning}
                  className="w-full flex items-center justify-center gap-1.5 bg-electric hover:bg-electric/80 disabled:opacity-40 text-white font-bold px-3 py-2 rounded-lg transition-all text-xs"
                >
                  {isRefining ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  Re-evaluate with changes
                </button>
                <button
                  onClick={handleDiscardChanges}
                  className="w-full text-center text-[11px] text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  Discard changes
                </button>
              </div>
            )}

            {criteria.length === 0 && addedCriteria.length === 0 && (
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
