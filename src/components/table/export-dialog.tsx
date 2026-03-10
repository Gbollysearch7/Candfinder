"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/ui-store";
import { useWebsetStore } from "@/stores/webset-store";
import { useExport } from "@/hooks/use-export";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ExportDialog() {
  const { exportDialogOpen, setExportDialogOpen, selectedRowIds } = useUiStore();
  const { items, activeWebset } = useWebsetStore();
  const { exportData } = useExport();

  const enrichments = activeWebset?.enrichments ?? [];

  const [scope, setScope] = useState<"all" | "selected">("all");
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());

  const allColumns = useMemo(() => {
    return [
      { id: "name", label: "Name" },
      { id: "url", label: "URL" },
      ...enrichments.map((e) => ({
        id: `enrichment-${e.id}`,
        label: e.description.slice(0, 40),
      })),
    ];
  }, [enrichments]);

  const allColumnIds = useMemo(() => new Set(allColumns.map((c) => c.id)), [allColumns]);
  const effectiveColumns = selectedColumns.size > 0 ? selectedColumns : allColumnIds;

  const toggleColumn = (id: string) => {
    setSelectedColumns((prev) => {
      if (prev.size === 0) {
        const next = new Set(allColumnIds);
        next.delete(id);
        return next;
      }
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (effectiveColumns.size === allColumns.length) {
      setSelectedColumns(new Set());
    } else {
      setSelectedColumns(new Set(allColumnIds));
    }
  };

  const handleExport = () => {
    exportData({
      scope,
      columns: Array.from(effectiveColumns),
      format,
      selectedIds: scope === "selected" ? selectedRowIds : undefined,
    });
    toast.success(`Exported ${scope === "selected" ? selectedRowIds.size : items.length} candidates as ${format.toUpperCase()}`);
    setExportDialogOpen(false);
  };

  return (
    <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
      <DialogContent className="bg-surface border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Download className="h-4 w-4 text-primary" />
            Export Candidates
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Scope */}
          <div className="space-y-2">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Scope
            </label>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === "all"}
                  onChange={() => setScope("all")}
                  className="accent-primary"
                />
                <span className="text-xs">All candidates ({items.length})</span>
              </label>
              <label className={cn("flex items-center gap-2", selectedRowIds.size === 0 ? "opacity-40 cursor-not-allowed" : "cursor-pointer")}>
                <input
                  type="radio"
                  name="scope"
                  checked={scope === "selected"}
                  onChange={() => setScope("selected")}
                  disabled={selectedRowIds.size === 0}
                  className="accent-primary"
                />
                <span className="text-xs">Selected ({selectedRowIds.size})</span>
              </label>
            </div>
          </div>

          {/* Columns */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Columns
              </label>
              <button onClick={toggleAll} className="text-[10px] text-primary hover:underline underline-offset-2">
                {effectiveColumns.size === allColumns.length ? "Deselect all" : "Select all"}
              </button>
            </div>
            <div className="space-y-1 max-h-[160px] overflow-y-auto">
              {allColumns.map((col) => (
                <label key={col.id} className="flex items-center gap-2 cursor-pointer py-0.5">
                  <input
                    type="checkbox"
                    checked={effectiveColumns.has(col.id)}
                    onChange={() => toggleColumn(col.id)}
                    className="h-3.5 w-3.5 rounded accent-primary"
                  />
                  <span className="text-xs truncate">{col.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Format
            </label>
            <div className="flex gap-1 bg-surface-elevated rounded-lg p-1">
              <button
                onClick={() => setFormat("csv")}
                className={cn(
                  "flex-1 text-xs font-medium px-3 py-1.5 rounded-md transition-colors",
                  format === "csv"
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                CSV
              </button>
              <button
                onClick={() => setFormat("json")}
                className={cn(
                  "flex-1 text-xs font-medium px-3 py-1.5 rounded-md transition-colors",
                  format === "json"
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                JSON
              </button>
            </div>
          </div>
        </div>

        <Button
          onClick={handleExport}
          disabled={effectiveColumns.size === 0}
          className="w-full bg-primary hover:bg-primary/90 text-white gap-2"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </Button>
      </DialogContent>
    </Dialog>
  );
}
