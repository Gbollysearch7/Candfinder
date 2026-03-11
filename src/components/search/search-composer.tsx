"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { CriteriaEditor } from "./criteria-editor";
import { useWebsetStore } from "@/stores/webset-store";
import { createWebset } from "@/lib/api-client";
import { DEFAULT_RESULT_COUNT, RESULT_COUNT_OPTIONS } from "@/lib/constants";
import { parseCountFromQuery, parseQueryToEnrichments, type EnrichmentSuggestion } from "@/lib/query-parser";
import { Loader2, ChevronDown, ChevronUp, Ban, Sparkles, X, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { ExcludeRef } from "@/lib/exa-types";
import { toast } from "sonner";

interface SearchComposerProps {
  initialQuery?: string;
}

export function SearchComposer({ initialQuery }: SearchComposerProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (initialQuery) setQuery(initialQuery);
  }, [initialQuery]);
  const [manualCriteria, setManualCriteria] = useState<string[]>([]);
  const [count, setCount] = useState(DEFAULT_RESULT_COUNT);
  const [countSource, setCountSource] = useState<"auto" | "manual">("auto");
  const [enrichmentSuggestions, setEnrichmentSuggestions] = useState<EnrichmentSuggestion[]>([]);
  const [dismissedEnrichments, setDismissedEnrichments] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-detect count + enrichment suggestions from query
  const parseQuery = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // Count
      if (countSource === "auto") {
        const parsedCount = parseCountFromQuery(q);
        setCount(parsedCount ?? DEFAULT_RESULT_COUNT);
      }
      // Enrichment suggestions
      const suggestions = parseQueryToEnrichments(q);
      setEnrichmentSuggestions(suggestions);
      setDismissedEnrichments(new Set());
    }, 400);
  }, [countSource]);

  useEffect(() => {
    if (query.trim().length > 5) {
      parseQuery(query);
    } else {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setEnrichmentSuggestions([]);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, parseQuery]);

  const visibleEnrichments = enrichmentSuggestions.filter(
    (e) => !dismissedEnrichments.has(e.description)
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [excludedWebsetIds, setExcludedWebsetIds] = useState<Set<string>>(new Set());

  const { setActiveWebset, setIsSearching } = useWebsetStore();
  const websetList = useWebsetStore((s) => s.websetList);

  const toggleExclusion = (websetId: string) => {
    setExcludedWebsetIds((prev) => {
      const next = new Set(prev);
      if (next.has(websetId)) {
        next.delete(websetId);
      } else {
        next.add(websetId);
      }
      return next;
    });
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setIsSearching(true);

    try {
      const excludeRefs: ExcludeRef[] = Array.from(excludedWebsetIds).map((id) => ({
        source: "webset" as const,
        id,
      }));

      const filteredCriteria = manualCriteria
        .filter((c) => c.trim())
        .map((c) => ({ description: c.trim() }));

      // Auto-enrichments from parsed query — these become soft match/unmatch columns
      const autoEnrichments = visibleEnrichments.map((e) => ({
        description: e.description,
        format: "text" as const,
      }));

      const payload = {
        search: {
          query: query.trim(),
          entity: { type: "person" as const },
          ...(filteredCriteria.length > 0 ? { criteria: filteredCriteria } : {}),
          count,
        },
        ...(excludeRefs.length > 0 ? { exclude: excludeRefs } : {}),
        ...(autoEnrichments.length > 0 ? { enrichments: autoEnrichments } : {}),
      };

      const webset = await createWebset(payload);
      setActiveWebset(webset);
      toast.success("Search launched");

      const { setWebsetList } = useWebsetStore.getState();
      const { listWebsets } = await import("@/lib/api-client");
      const result = await listWebsets({ limit: 50 });
      setWebsetList(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create search");
      toast.error("Failed to launch search");
      console.error("Search error:", err);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const excludableWebsets = websetList.filter(
    (ws) => ws.status === "idle" && ws.searches?.[0]?.progress?.found
  );

  return (
    <div className="space-y-3">
      {/* Unified search box — textarea + criteria pills + action bar inside */}
      <div className="relative glass-panel rounded-xl overflow-hidden focus-within:border-mystic/40 transition-colors">
        <textarea
          id="search-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe who you're looking for..."
          className="w-full bg-transparent text-base text-white resize-none p-6 pb-2 min-h-[100px] outline-none placeholder:text-white/30"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              handleSearch();
            }
          }}
        />

        {/* Auto-enrichment suggestions */}
        <AnimatePresence mode="popLayout">
          {visibleEnrichments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-1.5 px-6 pb-2"
            >
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground mr-1 self-center">
                <Sparkles className="h-3 w-3 text-accent-amber/60" />
                <span className="text-[10px]">Enrich</span>
              </span>
              {visibleEnrichments.map((enrichment) => (
                <motion.span
                  key={enrichment.description}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-amber/10 border border-accent-amber/20 text-xs text-accent-amber font-medium"
                >
                  <Check className="h-3 w-3" />
                  {enrichment.label}
                  <button
                    onClick={() => setDismissedEnrichments((prev) => new Set([...prev, enrichment.description]))}
                    className="ml-0.5 hover:text-foreground transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action bar inside search box */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              Options
              {excludedWebsetIds.size > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                  {excludedWebsetIds.size} excluded
                </span>
              )}
            </button>

            {/* Result count selector */}
            <div className="flex items-center gap-1.5 ml-2">
              {RESULT_COUNT_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => { setCount(n); setCountSource("manual"); }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    count === n
                      ? "bg-electric/20 text-electric border border-electric/30"
                      : "bg-white/5 text-muted-foreground border border-white/10 hover:border-white/20 hover:text-foreground"
                  }`}
                >
                  {n}
                </button>
              ))}
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={!RESULT_COUNT_OPTIONS.includes(count as typeof RESULT_COUNT_OPTIONS[number]) ? count : ""}
                  placeholder="Custom"
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (v >= 1 && v <= 1000) { setCount(v); setCountSource("manual"); }
                  }}
                  className={`w-[72px] px-2.5 py-1 rounded-md text-xs font-medium border bg-white/5 outline-none transition-colors placeholder:text-muted-foreground/50 ${
                    !RESULT_COUNT_OPTIONS.includes(count as typeof RESULT_COUNT_OPTIONS[number])
                      ? "border-electric/30 text-electric bg-electric/10"
                      : "border-white/10 text-muted-foreground hover:border-white/20"
                  }`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">results</span>
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={!query.trim() || loading}
            className="bg-electric hover:bg-electric/80 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-8 py-2.5 rounded-lg transition-all shadow-lg shadow-electric/20 active:scale-[0.97] text-sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Search"
            )}
          </button>
        </div>
      </div>

      {/* Advanced section */}
      {showAdvanced && (
        <div className="space-y-4 p-4 rounded-xl glass-panel">
          <CriteriaEditor criteria={manualCriteria} onChange={setManualCriteria} />

          {excludableWebsets.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Ban className="h-3 w-3 text-muted-foreground" />
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Exclude previous results
                </label>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Skip candidates already found in these searches.
              </p>
              <div className="space-y-1 max-h-[160px] overflow-y-auto">
                {excludableWebsets.map((ws) => {
                  const wsQuery = ws.searches?.[0]?.query ?? "Untitled";
                  const candidateCount = ws.searches?.[0]?.progress?.found ?? 0;
                  const isExcluded = excludedWebsetIds.has(ws.id);

                  return (
                    <label
                      key={ws.id}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                        isExcluded
                          ? "bg-primary/10 border border-primary/20"
                          : "bg-surface-elevated border border-transparent hover:border-border"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isExcluded}
                        onChange={() => toggleExclusion(ws.id)}
                        className="h-3.5 w-3.5 rounded border-border accent-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">
                          {wsQuery.length > 45 ? wsQuery.slice(0, 45) + "..." : wsQuery}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {candidateCount} candidate{candidateCount !== 1 ? "s" : ""}
                          {" · "}
                          {new Date(ws.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
              {excludedWebsetIds.size > 0 && (
                <button
                  onClick={() => setExcludedWebsetIds(new Set())}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear all exclusions
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-accent-red bg-accent-red/10 px-3 py-2 rounded-lg border border-accent-red/20">
          {error}
        </p>
      )}
    </div>
  );
}
