"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUiStore } from "@/stores/ui-store";
import { useWebsetStore } from "@/stores/webset-store";
import { createEnrichment } from "@/lib/api-client";
import { RECRUITMENT_PRESETS } from "@/lib/recruitment-presets";
import type { EnrichmentFormat } from "@/lib/exa-types";
import {
  Mail, Phone, Linkedin, Building2, Briefcase,
  Clock, Code, GraduationCap, MapPin, Github,
  UserCheck, Check, Loader2, ChevronDown, Settings2,
  X, ArrowRight, Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

const iconMap: Record<string, React.ElementType> = {
  Mail, Phone, Linkedin, Building2, Briefcase,
  Clock, Code, GraduationCap, MapPin, Github, UserCheck,
};

export function AddColumnDialog() {
  const { addColumnOpen, setAddColumnOpen } = useUiStore();
  const { activeWebsetId, addEnrichment } = useWebsetStore();
  const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  // Custom form state
  const [customDesc, setCustomDesc] = useState("");
  const [customFormat, setCustomFormat] = useState<EnrichmentFormat>("text");

  const togglePreset = (presetId: string) => {
    setSelectedPresets((prev) => {
      const next = new Set(prev);
      if (next.has(presetId)) next.delete(presetId);
      else next.add(presetId);
      return next;
    });
  };

  const handleAddSelected = async () => {
    if (!activeWebsetId || selectedPresets.size === 0) return;

    setLoading(true);
    try {
      const results = await Promise.all(
        Array.from(selectedPresets).map((presetId) => {
          const preset = RECRUITMENT_PRESETS.find((p) => p.id === presetId);
          if (!preset) return null;
          return createEnrichment(activeWebsetId, {
            description: preset.prompt,
            format: preset.format,
            ...(preset.options ? { options: preset.options } : {}),
          });
        })
      );

      results.forEach((enrichment) => {
        if (enrichment) addEnrichment(enrichment);
      });

      toast.success(`Added ${selectedPresets.size} enrichment column${selectedPresets.size !== 1 ? "s" : ""}`);
      setSelectedPresets(new Set());
      setAddColumnOpen(false);
    } catch (err) {
      toast.error("Failed to add enrichments");
      console.error("Failed to add enrichments:", err);
    }
    setLoading(false);
  };

  const handleAddCustom = async () => {
    if (!activeWebsetId || !customDesc.trim()) return;

    setLoading(true);
    try {
      const enrichment = await createEnrichment(activeWebsetId, {
        description: customDesc.trim(),
        format: customFormat,
      });
      addEnrichment(enrichment);
      toast.success("Custom column added");
      setAddColumnOpen(false);
      setCustomDesc("");
      setCustomFormat("text");
    } catch (err) {
      toast.error("Failed to add column");
      console.error("Failed to add enrichment:", err);
    }
    setLoading(false);
  };

  return (
    <Sheet open={addColumnOpen} onOpenChange={setAddColumnOpen}>
      <SheetContent className="w-[440px] bg-card border-border p-0 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-5 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary">
              <Database className="h-4 w-4" />
            </div>
            <h2 className="text-foreground text-lg font-bold tracking-tight">
              Add Enrichment Columns
            </h2>
          </div>
          <button
            onClick={() => setAddColumnOpen(false)}
            className="p-2 rounded-full hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Main Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Preset Grid — square aspect-ratio cards */}
          <div className="grid grid-cols-2 gap-3">
            {RECRUITMENT_PRESETS.map((preset) => {
              const Icon = iconMap[preset.icon] ?? Code;
              const isSelected = selectedPresets.has(preset.id);

              return (
                <button
                  key={preset.id}
                  onClick={() => togglePreset(preset.id)}
                  disabled={loading}
                  className={cn(
                    "relative group cursor-pointer aspect-square rounded-xl p-4 flex flex-col justify-end overflow-hidden transition-all text-left disabled:opacity-50",
                    isSelected
                      ? "border-2 border-primary bg-surface hover:ring-2 hover:ring-primary/50"
                      : "border border-border bg-surface hover:border-primary/50 hover:bg-surface-elevated"
                  )}
                >
                  {/* Checkmark overlay */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 bg-primary text-white rounded-full size-6 flex items-center justify-center">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none rounded-xl" />

                  {/* Icon positioned at top-left */}
                  <div className="absolute top-4 left-4">
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        isSelected ? "text-primary" : "text-muted-foreground/60"
                      )}
                    />
                  </div>

                  {/* Label at bottom */}
                  <p
                    className={cn(
                      "relative z-10 text-sm font-semibold",
                      isSelected ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {preset.label}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Custom Section — collapsible details-style */}
          <div className="mt-4">
            <button
              onClick={() => setShowCustom(!showCustom)}
              className="w-full flex items-center justify-between p-4 bg-surface rounded-xl border border-border hover:bg-surface-elevated transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings2 className={cn("h-4 w-4", showCustom ? "text-primary" : "text-muted-foreground")} />
                <span className="text-sm font-medium text-foreground">Custom Column</span>
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                showCustom && "rotate-180"
              )} />
            </button>

            <AnimatePresence>
              {showCustom && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-5 pt-3 border border-t-0 border-border rounded-b-xl bg-surface space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Configure your own data enrichment parameters using AI.
                    </p>

                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1 block">
                        What should this column extract?
                      </label>
                      <Textarea
                        value={customDesc}
                        onChange={(e) => setCustomDesc(e.target.value)}
                        placeholder="e.g. Find the number of open source contributions..."
                        className="bg-card border-border text-sm min-h-[80px]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1 block">
                        Data format
                      </label>
                      <Select value={customFormat} onValueChange={(v) => setCustomFormat(v as EnrichmentFormat)}>
                        <SelectTrigger className="bg-card border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="url">URL</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <button
                      onClick={handleAddCustom}
                      disabled={!customDesc.trim() || loading}
                      className="w-full bg-surface-elevated hover:bg-border text-foreground text-xs font-medium py-2.5 rounded-lg border border-border transition-colors disabled:opacity-40"
                    >
                      {loading ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : "Add custom column"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sticky Footer */}
        <footer className="p-6 border-t border-border bg-card flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-medium">Selection</span>
            <span className="text-sm text-foreground font-bold">
              {selectedPresets.size > 0
                ? `${selectedPresets.size} column${selectedPresets.size !== 1 ? "s" : ""} selected`
                : "Select columns to add"}
            </span>
          </div>
          <button
            onClick={handleAddSelected}
            disabled={selectedPresets.size === 0 || loading}
            className="flex-1 max-w-[180px] bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Add Columns</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </footer>
      </SheetContent>
    </Sheet>
  );
}
