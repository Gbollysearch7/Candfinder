"use client";

import { useState, useEffect, useRef } from "react";
import { useWebsetStore } from "@/stores/webset-store";
import { cancelWebset } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const STATUS_PHASES = [
  "Scanning the web for candidates...",
  "Analyzing potential matches...",
  "Evaluating criteria...",
  "Filtering top results...",
];

export function SearchInProgress() {
  const { activeWebset, activeWebsetId, updateActiveWebset } =
    useWebsetStore();
  const [messageIndex, setMessageIndex] = useState(0);

  const query = activeWebset?.searches?.[0]?.query ?? "";
  const progress = activeWebset?.searches?.[0]?.progress;

  // Real completion from API (0 to 1), fallback to simulated progress
  const apiCompletion = progress?.completion ?? 0;
  const found = progress?.found ?? 0;

  // Simulated progress that smoothly advances and lands on real value
  const [displayPct, setDisplayPct] = useState(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const realPct = Math.round(apiCompletion * 100);

      if (realPct >= 100) {
        // API says done — jump to 100
        setDisplayPct(100);
        clearInterval(interval);
        return;
      }

      setDisplayPct((prev) => {
        // Simulated progress: slow logarithmic climb, never exceeds real if real > 0
        const simulated = Math.min(Math.round(15 * Math.log(elapsed + 1)), 85);
        // Use whichever is higher: real API progress or simulated (capped at 90 if no API data)
        const target = realPct > 0 ? Math.max(realPct, simulated) : simulated;
        // Only go forward
        return Math.max(prev, Math.min(target, 99));
      });
    }, 300);

    return () => clearInterval(interval);
  }, [apiCompletion]);

  // Cycle status messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => {
        if (found > 0) {
          return (prev + 1) % (STATUS_PHASES.length + 1);
        }
        return (prev + 1) % STATUS_PHASES.length;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [found]);

  const currentMessage =
    messageIndex < STATUS_PHASES.length
      ? STATUS_PHASES[messageIndex]
      : `Found ${found} candidates so far...`;

  const handleCancel = async () => {
    if (!activeWebsetId) return;
    try {
      const updated = await cancelWebset(activeWebsetId);
      updateActiveWebset(updated);
      toast.success("Search cancelled");
    } catch {
      toast.error("Failed to cancel search");
    }
  };

  const SHIMMER_ROWS = [
    { opacity: 1, nameW: "w-24", roleW: "w-32", locW: "w-20" },
    { opacity: 1, nameW: "w-20", roleW: "w-28", locW: "w-24" },
    { opacity: 1, nameW: "w-28", roleW: "w-36", locW: "w-16" },
    { opacity: 0.7, nameW: "w-16", roleW: "w-20", locW: "w-28" },
    { opacity: 0.4, nameW: "w-32", roleW: "w-24", locW: "w-20" },
    { opacity: 0.2, nameW: "w-24", roleW: "w-20", locW: "w-24" },
  ];

  return (
    <div className="flex-1 overflow-y-auto relative">
      <div className="max-w-4xl mx-auto px-8 pt-12 pb-24 flex flex-col items-center text-center">
        {/* Locked Query Container */}
        <div className="inline-flex items-center gap-3 px-4 py-2 glass-panel rounded-full mb-12">
          <Lock className="h-3.5 w-3.5 text-white/40" />
          <span className="text-sm font-medium text-white/80">{query}</span>
          <span className="w-px h-3 bg-white/10 mx-1" />
          <span className="text-xs text-white/40 uppercase tracking-widest font-semibold">
            Active Search
          </span>
        </div>

        {/* Progress Bar — the main focus */}
        <div className="w-full max-w-lg mb-12">
          {/* Percentage display */}
          <div className="flex items-baseline justify-center mb-6">
            <motion.span
              key={displayPct}
              initial={{ opacity: 0.6, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[72px] font-bold text-white leading-none tracking-tight tabular-nums"
            >
              {displayPct}
            </motion.span>
            <span className="text-3xl font-bold text-white/40 ml-1">%</span>
          </div>

          {/* Bar */}
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-electric to-electric/70"
              style={{ width: `${displayPct}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>

          {/* Status message */}
          <div className="flex items-center justify-center gap-2 mt-5 h-6">
            <div className="h-1.5 w-1.5 rounded-full bg-electric animate-pulse" />
            <AnimatePresence mode="wait">
              <motion.p
                key={currentMessage}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="text-sm text-white/40 font-medium"
              >
                {currentMessage}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Found count */}
          {found > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-white/30 mt-3"
            >
              {found} candidate{found !== 1 ? "s" : ""} found
            </motion.p>
          )}
        </div>

        {/* Skeleton Preview Table */}
        <div className="w-full glass-panel rounded-xl overflow-hidden shadow-2xl">
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-white/5 bg-white/[0.02]">
            <div className="text-left text-xs font-semibold text-white/40 uppercase tracking-wider">
              Candidate
            </div>
            <div className="text-left text-xs font-semibold text-white/40 uppercase tracking-wider">
              Current Role
            </div>
            <div className="text-left text-xs font-semibold text-white/40 uppercase tracking-wider">
              Location
            </div>
            <div className="text-right text-xs font-semibold text-white/40 uppercase tracking-wider">
              Match
            </div>
          </div>

          {/* Shimmer Rows */}
          <div className="divide-y divide-white/5">
            {SHIMMER_ROWS.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-4 gap-4 px-6 py-6 items-center"
                style={{ opacity: row.opacity }}
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className={`h-3 ${row.nameW} rounded`} />
                </div>
                <Skeleton className={`h-3 ${row.roleW} rounded`} />
                <Skeleton className={`h-3 ${row.locW} rounded`} />
                <div className="flex justify-end">
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cancel Button */}
        <div className="mt-16">
          <button
            onClick={handleCancel}
            className="px-6 py-2.5 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-sm font-medium text-white/40 hover:text-white flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancel Search
          </button>
        </div>
      </div>
    </div>
  );
}
