"use client";

import { useState } from "react";
import { useWebsetStore } from "@/stores/webset-store";
import { createSearch } from "@/lib/api-client";
import { RESULT_COUNT_OPTIONS } from "@/lib/constants";
import { Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";

export function FindMoreBar() {
  const activeWebset = useWebsetStore((s) => s.activeWebset);
  const activeWebsetId = useWebsetStore((s) => s.activeWebsetId);
  const addSearch = useWebsetStore((s) => s.addSearch);
  const items = useWebsetStore((s) => s.items);

  const [count, setCount] = useState(25);
  const [customCount, setCustomCount] = useState("");
  const [loading, setLoading] = useState(false);

  if (!activeWebset || !activeWebsetId) return null;

  const isRunning = activeWebset.status === "running" || activeWebset.status === "pending";
  const lastSearch = activeWebset.searches?.[activeWebset.searches.length - 1];
  const query = lastSearch?.query ?? "";
  const criteria = lastSearch?.criteria ?? [];

  const handleFindMore = async (requestedCount: number) => {
    if (!query || loading) return;
    setLoading(true);
    try {
      const search = await createSearch(activeWebsetId, {
        query,
        entity: { type: "person" },
        criteria: criteria.map((c) => ({ description: c.description })),
        count: requestedCount,
        behavior: "append",
      });
      addSearch(search);
      toast.success(`Finding ${requestedCount} more candidates...`);
    } catch (err) {
      toast.error("Failed to find more results");
      console.error("Find more error:", err);
    } finally {
      setLoading(false);
    }
  };

  const effectiveCount = customCount ? parseInt(customCount, 10) : count;

  return (
    <div className="border-t border-border bg-surface/80 px-4 py-2.5 flex items-center gap-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Search className="h-3 w-3" />
        <span className="font-medium">{items.length} found</span>
        <span className="text-muted-foreground/50">|</span>
        <span>Find more:</span>
      </div>

      <div className="flex items-center gap-1.5">
        {RESULT_COUNT_OPTIONS.map((n) => (
          <button
            key={n}
            onClick={() => { setCount(n); setCustomCount(""); }}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              count === n && !customCount
                ? "bg-electric/20 text-electric border border-electric/30"
                : "bg-white/5 text-muted-foreground border border-white/10 hover:border-white/20 hover:text-foreground"
            }`}
          >
            {n}
          </button>
        ))}
        <input
          type="number"
          min={1}
          max={1000}
          value={customCount}
          placeholder="Custom"
          onChange={(e) => setCustomCount(e.target.value)}
          className={`w-[72px] px-2.5 py-1 rounded-md text-xs font-medium border bg-white/5 outline-none transition-colors placeholder:text-muted-foreground/50 ${
            customCount
              ? "border-electric/30 text-electric bg-electric/10"
              : "border-white/10 text-muted-foreground hover:border-white/20"
          }`}
        />
      </div>

      <button
        onClick={() => handleFindMore(effectiveCount)}
        disabled={loading || isRunning || effectiveCount < 1}
        className="flex items-center gap-1.5 bg-electric hover:bg-electric/80 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-4 py-1.5 rounded-lg transition-all text-xs"
      >
        {loading || isRunning ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Plus className="h-3 w-3" />
        )}
        {isRunning ? "Searching..." : "Find more"}
      </button>

      {isRunning && lastSearch?.progress && (
        <div className="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-electric opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-electric" />
          </span>
          <span className="tabular-nums">
            {lastSearch.progress.analyzed} analyzed
          </span>
        </div>
      )}
    </div>
  );
}
