"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useWebsetStore } from "@/stores/webset-store";
import { useUiStore } from "@/stores/ui-store";
import { EnrichmentCell } from "./enrichment-cell";
import { AddColumnDialog } from "./add-column-dialog";
import { FloatingActionBar } from "./floating-action-bar";
import { TableEmptyState } from "./table-empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Zap, Download, Search, ExternalLink, ArrowUpDown, MoreVertical, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteEnrichment } from "@/lib/api-client";
import {
  type WebsetItem,
  getItemName,
  getItemUrl,
  getItemPosition,
  getItemCompany,
  getItemLocation,
  getItemDescription,
  getItemPictureUrl,
  findEnrichmentResult,
  getEnrichmentValue,
} from "@/lib/exa-types";
import { hashToColor, getInitials } from "@/lib/name-hash";
import { motion } from "framer-motion";
import { toast } from "sonner";

/** Row avatar — shows profile photo or colored initials */
function RowAvatar({ item }: { item: WebsetItem }) {
  const name = getItemName(item);
  const pictureUrl = getItemPictureUrl(item);
  const colors = hashToColor(name);
  const initials = getInitials(name);
  const [imgError, setImgError] = useState(false);

  if (pictureUrl && !imgError) {
    return (
      <img
        src={pictureUrl}
        alt={name}
        className="h-7 w-7 rounded-full object-cover shrink-0"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold"
      style={{ background: colors.bg, color: colors.text }}
    >
      {initials}
    </div>
  );
}

/** Criteria match badge like Exa — green Match, red Miss, grey Unclear + ref count */
function CriteriaMatchBadge({ satisfied, refCount }: { satisfied: "yes" | "no" | "unknown"; refCount: number }) {
  if (satisfied === "yes") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-green/20 text-accent-green">
          Match
        </span>
        {refCount > 0 && (
          <span className="text-[10px] text-muted-foreground tabular-nums">{refCount} ref.</span>
        )}
      </div>
    );
  }
  if (satisfied === "no") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-red/20 text-accent-red">
          Miss
        </span>
        {refCount > 0 && (
          <span className="text-[10px] text-muted-foreground tabular-nums">{refCount} ref.</span>
        )}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted-foreground/20 text-muted-foreground">
        Unclear
      </span>
      {refCount > 0 && (
        <span className="text-[10px] text-muted-foreground tabular-nums">{refCount} ref.</span>
      )}
    </div>
  );
}

export function CandidatesTable() {
  const items = useWebsetStore((s) => s.items);
  const activeWebset = useWebsetStore((s) => s.activeWebset);
  const activeWebsetId = useWebsetStore((s) => s.activeWebsetId);
  const removeEnrichment = useWebsetStore((s) => s.removeEnrichment);
  const { setAddColumnOpen, openDetail } = useUiStore();
  const selectedRowIds = useUiStore((s) => s.selectedRowIds);
  const toggleRowSelection = useUiStore((s) => s.toggleRowSelection);
  const selectAllRows = useUiStore((s) => s.selectAllRows);
  const clearSelection = useUiStore((s) => s.clearSelection);
  const setExportDialogOpen = useUiStore((s) => s.setExportDialogOpen);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [focusedRowIndex, setFocusedRowIndex] = useState(-1);
  const detailPanelOpen = useUiStore((s) => s.detailPanelOpen);

  // Refs for keyboard handler to avoid re-registering on every state change
  const focusedRowRef = useRef(focusedRowIndex);
  focusedRowRef.current = focusedRowIndex;
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Stable keyboard handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return;

    const currentItems = itemsRef.current;
    const currentFocus = focusedRowRef.current;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedRowIndex((prev) => Math.min(prev + 1, currentItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedRowIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && currentFocus >= 0 && currentFocus < currentItems.length) {
      e.preventDefault();
      openDetail(currentItems[currentFocus].id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      clearSelection();
      setFocusedRowIndex(-1);
    } else if ((e.metaKey || e.ctrlKey) && e.key === "a" && currentItems.length > 0) {
      e.preventDefault();
      selectAllRows(currentItems.map((i) => i.id));
    }
  }, [openDetail, clearSelection, selectAllRows]);

  useEffect(() => {
    if (detailPanelOpen) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [detailPanelOpen, handleKeyDown]);

  // Track animated rows
  const animatedIdsRef = useRef<Set<string>>(new Set());
  const prevWebsetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeWebsetId !== prevWebsetIdRef.current) {
      animatedIdsRef.current.clear();
      prevWebsetIdRef.current = activeWebsetId;
    }
  }, [activeWebsetId]);

  const enrichments = activeWebset?.enrichments ?? [];
  const criteria = activeWebset?.searches?.[0]?.criteria ?? [];
  const hasSelection = selectedRowIds.size > 0;

  const allRowIds = useMemo(() => items.map((i) => i.id), [items]);
  const allSelected = items.length > 0 && selectedRowIds.size === items.length;

  const columns = useMemo<ColumnDef<WebsetItem>[]>(() => {
    // Select checkbox column
    const selectCol: ColumnDef<WebsetItem> = {
      id: "select",
      size: 36,
      header: () => (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={() => {
            if (allSelected) clearSelection();
            else selectAllRows(allRowIds);
          }}
          className={cn(
            "h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer",
            !hasSelection && "opacity-0 group-hover/thead:opacity-100"
          )}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedRowIds.has(row.original.id)}
          onChange={(e) => {
            e.stopPropagation();
            toggleRowSelection(row.original.id);
          }}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer",
            !hasSelection && "opacity-0 group-hover:opacity-100"
          )}
        />
      ),
    };

    // Name column with row number + avatar
    const nameCol: ColumnDef<WebsetItem> = {
      id: "name",
      header: "Name",
      size: 220,
      cell: ({ row }) => {
        const name = getItemName(row.original);
        const rowIndex = items.findIndex((i) => i.id === row.original.id);
        return (
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] text-muted-foreground/50 tabular-nums w-4 text-right shrink-0">
              {rowIndex + 1}
            </span>
            <RowAvatar item={row.original} />
            <span className="font-bold text-[13px] truncate text-white">
              {name}
            </span>
          </div>
        );
      },
    };

    // Company
    const companyCol: ColumnDef<WebsetItem> = {
      id: "company",
      header: "Company",
      size: 160,
      cell: ({ row }) => {
        const company = getItemCompany(row.original);
        if (!company) return <span className="text-muted-foreground text-xs">--</span>;
        return <span className="text-xs truncate block font-medium">{company}</span>;
      },
    };

    // Job Title / Position
    const positionCol: ColumnDef<WebsetItem> = {
      id: "position",
      header: "Job Title",
      size: 200,
      cell: ({ row }) => {
        const position = getItemPosition(row.original);
        if (!position) return <span className="text-muted-foreground text-xs">--</span>;
        return <span className="text-xs truncate block">{position}</span>;
      },
    };

    // URL
    const urlCol: ColumnDef<WebsetItem> = {
      id: "url",
      header: "URL",
      size: 180,
      cell: ({ row }) => {
        const url = getItemUrl(row.original);
        if (!url) return <span className="text-muted-foreground text-xs">--</span>;
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-accent-blue hover:underline underline-offset-2 truncate flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 30)}
            <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-50" />
          </a>
        );
      },
    };

    // Criteria columns — one per criterion, showing Match/Miss badge + ref count
    const criteriaCols: ColumnDef<WebsetItem>[] = criteria.map((criterion, ci) => ({
      id: `criterion-${ci}`,
      header: () => (
        <span className="truncate" title={criterion.description}>
          {criterion.description.length > 20
            ? criterion.description.slice(0, 20) + "..."
            : criterion.description}
        </span>
      ),
      size: 140,
      cell: ({ row }: { row: { original: WebsetItem } }) => {
        const evaluation = row.original.evaluations?.find(
          (ev) => ev.criterion === criterion.description
        );
        if (!evaluation) {
          return <span className="text-muted-foreground/30 text-xs">--</span>;
        }
        const refCount = evaluation.references?.length ?? 0;
        return <CriteriaMatchBadge satisfied={evaluation.satisfied} refCount={refCount} />;
      },
    }));

    // Enrichment columns
    const enrichmentCols: ColumnDef<WebsetItem>[] = enrichments.map((enrichment) => ({
      id: `enrichment-${enrichment.id}`,
      header: () => {
        const isRunning = enrichment.status === "running";
        const completed = items.filter((item) => {
          const r = findEnrichmentResult(item, enrichment.id);
          return r && r.status !== "pending";
        }).length;

        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 group">
              <span className="truncate text-primary/80">{enrichment.description.slice(0, 25)}</span>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex">
                    <MoreVertical className="h-3 w-3 text-muted-foreground" />
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-accent-red text-xs"
                    onClick={async () => {
                      if (!activeWebsetId) return;
                      try {
                        await deleteEnrichment(activeWebsetId, enrichment.id);
                        removeEnrichment(enrichment.id);
                        toast.success("Column removed");
                      } catch (err) {
                        toast.error("Failed to remove column");
                        console.error("Failed to delete enrichment:", err);
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1.5" />
                    Remove column
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {isRunning && items.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Progress value={(completed / items.length) * 100} className="h-1 flex-1" />
                <span className="text-[9px] text-muted-foreground whitespace-nowrap tabular-nums">
                  {completed}/{items.length}
                </span>
              </div>
            )}
          </div>
        );
      },
      size: enrichment.format === "email" || enrichment.format === "url" ? 220 : 160,
      cell: ({ row }: { row: { original: WebsetItem } }) => {
        const result = findEnrichmentResult(row.original, enrichment.id);
        const value = getEnrichmentValue(result);
        return (
          <EnrichmentCell
            status={result?.status}
            value={value}
            format={enrichment.format}
          />
        );
      },
    }));

    // Location
    const locationCol: ColumnDef<WebsetItem> = {
      id: "location",
      header: "Location",
      size: 150,
      cell: ({ row }) => {
        const location = getItemLocation(row.original);
        if (!location) return <span className="text-muted-foreground text-xs">--</span>;
        return <span className="text-xs truncate block text-muted-foreground">{location}</span>;
      },
    };

    // Description
    const descriptionCol: ColumnDef<WebsetItem> = {
      id: "description",
      header: "Description",
      size: 250,
      cell: ({ row }) => {
        const desc = getItemDescription(row.original);
        if (!desc) return <span className="text-muted-foreground text-xs">--</span>;
        return (
          <span className="text-xs truncate block text-muted-foreground leading-snug">
            {desc.slice(0, 80)}{desc.length > 80 ? "..." : ""}
          </span>
        );
      },
    };

    // Source
    const sourceCol: ColumnDef<WebsetItem> = {
      id: "source",
      header: "Source",
      size: 120,
      cell: ({ row }) => {
        const source = row.original.source;
        if (!source) return <span className="text-muted-foreground text-xs">--</span>;
        return (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-elevated border border-border text-muted-foreground capitalize">
            {source}
          </span>
        );
      },
    };

    return [selectCol, nameCol, companyCol, positionCol, urlCol, locationCol, descriptionCol, sourceCol, ...criteriaCols, ...enrichmentCols];
  }, [enrichments, criteria, activeWebsetId, removeEnrichment, hasSelection, selectedRowIds, allSelected, allRowIds, clearSelection, selectAllRows, toggleRowSelection, items]);

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const filter = filterValue.toLowerCase();
      const fields = [
        getItemName(row.original),
        getItemUrl(row.original),
        getItemPosition(row.original),
        getItemCompany(row.original),
        getItemLocation(row.original),
      ];
      return fields.some((f) => f.toLowerCase().includes(filter));
    },
  });

  const isSearchActive = activeWebset?.status === "running" || activeWebset?.status === "pending";

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-1.5 border-b border-border bg-surface/50">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Filter..."
            className="pl-7 h-7 bg-transparent border-transparent text-xs focus:border-border focus:bg-surface-elevated placeholder:text-muted-foreground/50"
          />
        </div>

        <span className="text-[11px] text-muted-foreground ml-auto tabular-nums">
          {items.length} candidate{items.length !== 1 ? "s" : ""}
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExportDialogOpen(true)}
          className="text-muted-foreground hover:text-foreground text-xs h-7 gap-1"
          disabled={items.length === 0}
        >
          <Download className="h-3 w-3" />
          Export
        </Button>

        <Button
          size="sm"
          onClick={() => setAddColumnOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white text-xs h-7 gap-1"
        >
          <Zap className="h-3 w-3" />
          Enrich
        </Button>
      </div>

      {/* Table — native scroll to prevent browser swipe-back */}
      <div className="flex-1 overflow-auto" style={{ overscrollBehaviorX: "contain" }}>
        <div className="min-w-max">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-surface-solid group/thead">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-border">
                  {headerGroup.headers.map((header) => {
                    const isSelect = header.id === "select";
                    const isName = header.id === "name";
                    return (
                      <th
                        key={header.id}
                        style={{ width: header.getSize() }}
                        className={cn(
                          "text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider",
                          isSelect && "sticky left-0 z-[5] bg-surface-solid w-[36px]",
                          isName && "sticky left-[36px] z-[5] bg-surface-solid shadow-[2px_0_8px_rgba(0,0,0,0.3)]"
                        )}
                      >
                        {header.isPlaceholder ? null : isSelect ? (
                          flexRender(header.column.columnDef.header, header.getContext())
                        ) : (
                          <button
                            className="flex items-center gap-1 hover:text-foreground transition-colors"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <ArrowUpDown className="h-2.5 w-2.5 opacity-40" />
                          </button>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 && !isSearchActive && (
                <tr>
                  <td colSpan={columns.length}>
                    <TableEmptyState />
                  </td>
                </tr>
              )}
              {table.getRowModel().rows.length === 0 && isSearchActive && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center py-12 text-sm text-muted-foreground"
                  >
                    <div className="space-y-3">
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-8 mx-auto max-w-2xl" />
                        ))}
                      </div>
                      <p className="text-xs">Searching for candidates...</p>
                    </div>
                  </td>
                </tr>
              )}
              {table.getRowModel().rows.map((row, index) => {
                const shouldAnimate = !animatedIdsRef.current.has(row.original.id) && index < 10;
                if (shouldAnimate) {
                  animatedIdsRef.current.add(row.original.id);
                }

                const isEven = index % 2 === 0;
                const isSelected = selectedRowIds.has(row.original.id);
                const stickyCellBg = isSelected
                  ? "bg-[#0d1a2e]"
                  : !isEven
                    ? "bg-[#0e0e10]"
                    : "bg-[#050505]";

                const rowContent = row.getVisibleCells().map((cell) => {
                  const isSelect = cell.column.id === "select";
                  const isName = cell.column.id === "name";
                  return (
                    <td
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className={cn(
                        "px-3 py-1.5",
                        isSelect && `sticky left-0 z-[5] ${stickyCellBg} w-[36px]`,
                        isName && `sticky left-[36px] z-[5] ${stickyCellBg} shadow-[2px_0_8px_rgba(0,0,0,0.3)]`
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                });

                const isFocused = index === focusedRowIndex;
                const rowClasses = cn(
                  "border-b border-border/30 cursor-pointer transition-colors group",
                  "hover:bg-surface-hover",
                  "h-[42px]",
                  !isEven && "bg-surface/30",
                  isSelected && "bg-primary/8 hover:bg-primary/12",
                  isFocused && "ring-1 ring-inset ring-electric/50 bg-electric/5"
                );

                if (shouldAnimate) {
                  return (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.2 }}
                      onClick={() => openDetail(row.original.id)}
                      className={rowClasses}
                    >
                      {rowContent}
                    </motion.tr>
                  );
                }

                return (
                  <tr
                    key={row.id}
                    onClick={() => openDetail(row.original.id)}
                    className={rowClasses}
                  >
                    {rowContent}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <FloatingActionBar />
      <AddColumnDialog />
    </div>
  );
}
