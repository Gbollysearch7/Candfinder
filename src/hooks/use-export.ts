"use client";

import { useCallback } from "react";
import { useWebsetStore } from "@/stores/webset-store";
import {
  getItemName,
  getItemUrl,
  findEnrichmentResult,
  getEnrichmentValue,
} from "@/lib/exa-types";

export interface ExportOptions {
  scope: "all" | "selected";
  columns: string[];
  format: "csv" | "json";
  selectedIds?: Set<string>;
}

export function useExport() {
  const { items, activeWebset } = useWebsetStore();

  const exportData = useCallback(
    (options: ExportOptions) => {
      const enrichments = activeWebset?.enrichments ?? [];
      const filteredItems =
        options.scope === "selected" && options.selectedIds
          ? items.filter((i) => options.selectedIds!.has(i.id))
          : items;

      if (!filteredItems.length) return;

      // Build column config
      const showName = options.columns.includes("name");
      const showUrl = options.columns.includes("url");
      const enrichmentCols = enrichments.filter((e) =>
        options.columns.includes(`enrichment-${e.id}`)
      );

      if (options.format === "json") {
        const data = filteredItems.map((item) => {
          const obj: Record<string, string> = {};
          if (showName) obj["Name"] = getItemName(item);
          if (showUrl) obj["URL"] = getItemUrl(item);
          enrichmentCols.forEach((e) => {
            const result = findEnrichmentResult(item, e.id);
            obj[e.description] = getEnrichmentValue(result) ?? "";
          });
          return obj;
        });

        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json;charset=utf-8;",
        });
        downloadBlob(blob, `talist-${activeWebset?.id ?? "export"}.json`);
      } else {
        // CSV
        const headers: string[] = [];
        if (showName) headers.push("Name");
        if (showUrl) headers.push("URL");
        enrichmentCols.forEach((e) => headers.push(e.description));

        const rows = filteredItems.map((item) => {
          const row: string[] = [];
          if (showName) row.push(getItemName(item));
          if (showUrl) row.push(getItemUrl(item));
          enrichmentCols.forEach((e) => {
            const result = findEnrichmentResult(item, e.id);
            row.push(getEnrichmentValue(result) ?? "");
          });
          return row;
        });

        const csvContent = [
          headers.map(escapeCSV).join(","),
          ...rows.map((row) => row.map(escapeCSV).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        downloadBlob(blob, `talist-${activeWebset?.id ?? "export"}.csv`);
      }
    },
    [items, activeWebset]
  );

  // Convenience wrapper for quick CSV export (all columns, all items)
  const exportCSV = useCallback(() => {
    const enrichments = activeWebset?.enrichments ?? [];
    const allColumns = [
      "name",
      "url",
      ...enrichments.map((e) => `enrichment-${e.id}`),
    ];
    exportData({ scope: "all", columns: allColumns, format: "csv" });
  }, [exportData, activeWebset]);

  return { exportCSV, exportData };
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
