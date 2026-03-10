"use client";

import { useUiStore } from "@/stores/ui-store";
import { Download, X, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function FloatingActionBar() {
  const selectedRowIds = useUiStore((s) => s.selectedRowIds);
  const clearSelection = useUiStore((s) => s.clearSelection);
  const setExportDialogOpen = useUiStore((s) => s.setExportDialogOpen);
  const setAddColumnOpen = useUiStore((s) => s.setAddColumnOpen);

  const count = selectedRowIds.size;

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="glass-panel rounded-full px-6 py-3 flex items-center gap-8 shadow-2xl ring-1 ring-white/5">
            {/* Selection Info */}
            <div className="flex items-center gap-3">
              <div className="bg-mystic text-white text-[10px] font-bold px-2 py-0.5 rounded tabular-nums">
                {count}
              </div>
              <span className="text-sm font-medium text-white/80">
                Candidates Selected
              </span>
            </div>

            <div className="w-px h-6 bg-white/10" />

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setExportDialogOpen(true)}
                className="px-4 py-1.5 rounded-full hover:bg-white/5 text-sm font-semibold text-white/80 transition-colors"
              >
                Export CSV
              </button>
              <button
                onClick={() => setAddColumnOpen(true)}
                className="px-4 py-1.5 rounded-full hover:bg-white/5 text-sm font-semibold text-white/80 transition-colors flex items-center gap-1.5"
              >
                <Zap className="h-3.5 w-3.5" />
                Enrich
              </button>
              <button
                onClick={clearSelection}
                className="px-4 py-1.5 rounded-full bg-white text-[#050505] text-sm font-bold hover:bg-white/90 transition-colors shadow-lg shadow-white/5"
              >
                Deselect
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
