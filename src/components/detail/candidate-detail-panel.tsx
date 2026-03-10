"use client";

import { useEffect } from "react";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { useUiStore } from "@/stores/ui-store";
import { useWebsetStore } from "@/stores/webset-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AvatarInitials } from "@/components/shared/avatar-initials";
import {
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  MapPin,
  Sparkles,
  Mail,
  Link,
  Phone,
  Hash,
  FileText,
  ToggleLeft,
  Loader2,
  Ban,
} from "lucide-react";
import {
  getItemName,
  getItemUrl,
  getItemPosition,
  getItemLocation,
  getItemCompany,
  findEnrichmentResult,
  getEnrichmentValue,
} from "@/lib/exa-types";
import { AnimatePresence, motion } from "framer-motion";

export function CandidateDetailPanel() {
  const { detailPanelOpen, selectedItemId, closeDetail, navigateDetail } = useUiStore();
  const { items, activeWebset } = useWebsetStore();

  const item = items.find((i) => i.id === selectedItemId);
  const enrichments = activeWebset?.enrichments ?? [];

  const currentIndex = items.findIndex((i) => i.id === selectedItemId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  const itemName = item ? getItemName(item) : "Unknown";
  const itemUrl = item ? getItemUrl(item) : "";
  const itemPosition = item ? getItemPosition(item) : "";
  const itemLocation = item ? getItemLocation(item) : "";
  const itemCompany = item ? getItemCompany(item) : "";

  // Criteria met count
  const metCount = item?.evaluations?.filter((e) => e.satisfied === "yes").length ?? 0;
  const totalCriteria = item?.evaluations?.length ?? 0;

  // Keyboard navigation
  useEffect(() => {
    if (!detailPanelOpen) return;

    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      if (e.key === "Escape") {
        e.preventDefault();
        closeDetail();
      } else if (e.key === "ArrowLeft" && hasPrev) {
        e.preventDefault();
        navigateDetail("prev");
      } else if (e.key === "ArrowRight" && hasNext) {
        e.preventDefault();
        navigateDetail("next");
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [detailPanelOpen, hasPrev, hasNext, navigateDetail]);

  return (
    <Sheet open={detailPanelOpen} onOpenChange={(open) => !open && closeDetail()}>
      <SheetContent className="w-[480px] bg-card border-border p-0">
        <AnimatePresence mode="wait">
          {item ? (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col h-full"
            >
              {/* Panel Header — Navigation */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigateDetail("prev")}
                    disabled={!hasPrev}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-xs font-medium text-muted-foreground tracking-widest uppercase tabular-nums">
                    {currentIndex + 1} of {items.length}
                  </span>
                  <button
                    onClick={() => navigateDetail("next")}
                    disabled={!hasNext}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
                <button
                  onClick={closeDetail}
                  className="text-muted-foreground hover:text-foreground p-1 hover:bg-surface-elevated rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Panel Main Content */}
              <ScrollArea className="flex-1">
                <div className="p-8">
                  {/* Name + Title + Avatar */}
                  <div className="mb-8">
                    <div className="flex items-start gap-4 mb-3">
                      <AvatarInitials name={itemName} size="lg" />
                      <div className="flex-1 min-w-0">
                        <h2 className="text-3xl font-black text-foreground leading-tight mb-1">
                          {itemName}
                        </h2>
                        {itemPosition && (
                          <p className="text-muted-foreground text-lg">{itemPosition}</p>
                        )}
                      </div>
                    </div>
                    {itemUrl && (
                      <a
                        href={itemUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm flex items-center gap-1 font-medium"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {itemUrl.replace(/^https?:\/\/(www\.)?/, "").slice(0, 50)}
                      </a>
                    )}
                  </div>

                  {/* Pills / Badges Row */}
                  <div className="flex flex-wrap gap-2 mb-10">
                    {itemCompany && (
                      <span className="px-3 py-1.5 bg-surface-elevated text-muted-foreground rounded-lg text-xs font-medium flex items-center gap-1.5 border border-border">
                        <Building2 className="h-3.5 w-3.5" />
                        {itemCompany}
                      </span>
                    )}
                    {itemLocation && (
                      <span className="px-3 py-1.5 bg-surface-elevated text-muted-foreground rounded-lg text-xs font-medium flex items-center gap-1.5 border border-border">
                        <MapPin className="h-3.5 w-3.5" />
                        {itemLocation}
                      </span>
                    )}
                    {totalCriteria > 0 && (
                      <span className="px-3 py-1.5 bg-accent-green/10 text-accent-green rounded-lg text-xs font-bold border border-accent-green/20">
                        {metCount}/{totalCriteria} criteria met
                      </span>
                    )}
                  </div>

                  {/* Criteria Evaluation Section */}
                  {item.evaluations && item.evaluations.length > 0 && (
                    <div className="mb-10">
                      <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-4">
                        Criteria Evaluation
                      </h3>
                      <div className="space-y-4">
                        {item.evaluations.map((evaluation, i) => (
                          <div
                            key={i}
                            className="flex items-start justify-between gap-4 p-3 rounded-xl bg-surface border border-border"
                          >
                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground">
                                {evaluation.criterion}
                              </p>
                              {evaluation.reasoning && (
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {evaluation.reasoning}
                                </p>
                              )}
                            </div>
                            <span
                              className={`px-2 py-1 text-[10px] font-bold rounded uppercase shrink-0 ${
                                evaluation.satisfied === "yes"
                                  ? "bg-accent-green/20 text-accent-green"
                                  : evaluation.satisfied === "no"
                                  ? "bg-accent-red/20 text-accent-red"
                                  : "bg-muted-foreground/20 text-muted-foreground"
                              }`}
                            >
                              {evaluation.satisfied === "yes"
                                ? "Match"
                                : evaluation.satisfied === "no"
                                ? "Miss"
                                : "Unknown"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Enrichments Section — Card layout */}
                  {enrichments.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
                          Enrichments
                        </h3>
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {enrichments.map((enrichment) => {
                          const result = findEnrichmentResult(item, enrichment.id);
                          const value = getEnrichmentValue(result);
                          const isPending = result?.status === "pending";
                          const isCanceled = result?.status === "canceled";
                          const hasValue = value != null && value !== "";

                          const formatIconMap: Record<string, typeof Mail> = {
                            email: Mail,
                            url: Link,
                            phone: Phone,
                            number: Hash,
                            text: FileText,
                            date: FileText,
                            options: ToggleLeft,
                          };
                          const formatIcon = formatIconMap[enrichment.format] ?? FileText;
                          const FormatIcon = formatIcon;

                          return (
                            <div
                              key={enrichment.id}
                              className="p-3 rounded-xl bg-surface border border-border flex flex-col gap-2"
                            >
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                                  <FormatIcon className="h-3 w-3 text-primary" />
                                </div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold truncate">
                                  {enrichment.description.slice(0, 30)}
                                </span>
                              </div>

                              {isPending ? (
                                <div className="flex items-center gap-1.5 text-muted-foreground/50">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  <span className="text-xs italic">Loading...</span>
                                </div>
                              ) : isCanceled ? (
                                <div className="flex items-center gap-1.5 text-accent-red">
                                  <Ban className="h-3 w-3" />
                                  <span className="text-xs">Canceled</span>
                                </div>
                              ) : hasValue ? (
                                enrichment.format === "email" ? (
                                  <a href={`mailto:${value}`} className="text-primary font-mono text-xs hover:underline truncate">
                                    {value}
                                  </a>
                                ) : enrichment.format === "url" ? (
                                  <a
                                    href={value}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary text-xs hover:underline truncate flex items-center gap-1"
                                  >
                                    {value.replace(/^https?:\/\/(www\.)?/, "").slice(0, 35)}
                                    <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-50" />
                                  </a>
                                ) : value.includes(",") ? (
                                  <div className="flex flex-wrap gap-1">
                                    {value.split(",").slice(0, 4).map((tag, idx) => (
                                      <span
                                        key={idx}
                                        className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-surface-elevated rounded border border-border"
                                      >
                                        {tag.trim()}
                                      </span>
                                    ))}
                                    {value.split(",").length > 4 && (
                                      <span className="text-[10px] text-muted-foreground/50">
                                        +{value.split(",").length - 4}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-foreground text-xs font-medium leading-relaxed">
                                    {value.length > 80 ? value.slice(0, 80) + "..." : value}
                                  </p>
                                )
                              ) : (
                                <p className="text-muted-foreground/30 text-xs">No data</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Source Links */}
                  {item.evaluations?.some((e) => e.references?.length) && (
                    <div className="mt-10">
                      <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-3">
                        Sources
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {item.evaluations
                          .flatMap((e) => e.references ?? [])
                          .filter((s, i, arr) => arr.findIndex((x) => x.url === s.url) === i)
                          .map((source, i) => (
                            <a
                              key={i}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-surface-elevated border border-border hover:border-primary/30 transition-colors"
                            >
                              {(source.title ?? source.url.replace(/^https?:\/\/(www\.)?/, "")).slice(0, 30)}
                              <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                            </a>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
}
