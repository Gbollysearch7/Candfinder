"use client";

import { useWebsetStore } from "@/stores/webset-store";
import { useUiStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeft, X, Upload } from "lucide-react";
import { cancelWebset } from "@/lib/api-client";
import { toast } from "sonner";

export function Header() {
  const { activeWebset, activeWebsetId, items, updateActiveWebset } = useWebsetStore();
  const sidebarMode = useUiStore((s) => s.sidebarMode);
  const cycleSidebarMode = useUiStore((s) => s.cycleSidebarMode);
  const setExportDialogOpen = useUiStore((s) => s.setExportDialogOpen);
  const sidebarOpen = sidebarMode === "full";

  if (!activeWebset) return null;

  const query = activeWebset.searches?.[0]?.query ?? "Untitled";
  const found = items.length;
  const hasRunningSearch = activeWebset.searches?.some(
    (s) => s.status === "running" || s.status === "pending"
  );

  const handleCancel = async () => {
    if (!activeWebsetId) return;
    try {
      const updated = await cancelWebset(activeWebsetId);
      updateActiveWebset(updated);
      toast.success("Search cancelled");
    } catch (err) {
      toast.error("Failed to cancel search");
      console.error("Failed to cancel:", err);
    }
  };

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-white/10 px-8 py-5 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-white/40 hover:text-white"
          onClick={cycleSidebarMode}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
        </Button>

        <h1 className="font-display italic text-xl text-white font-extrabold tracking-tight">
          {query}
        </h1>

        {found > 0 && (
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <span className="relative flex h-2 w-2">
              {hasRunningSearch && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-electric opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                hasRunningSearch ? "bg-electric" : "bg-accent-green"
              }`} />
            </span>
            <span className="text-xs font-medium text-white/80">
              {found} candidates found
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setExportDialogOpen(true)}
          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-white transition-all flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Export
        </button>

        {activeWebset.status === "running" && (
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-accent-red/20 hover:border-accent-red/30 text-xs font-semibold text-white transition-all flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        )}
      </div>
    </header>
  );
}
