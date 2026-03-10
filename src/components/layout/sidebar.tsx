"use client";

import { useEffect, useState } from "react";
import { useWebsetStore } from "@/stores/webset-store";
import { useUiStore } from "@/stores/ui-store";
import { listWebsets, getWebset } from "@/lib/api-client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Search, Plus, History, PanelLeftClose, Zap } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";

function getStatusColor(status: string) {
  switch (status) {
    case "running":
    case "pending":
    case "active":
      return "bg-electric";
    case "idle":
    case "completed":
      return "bg-accent-green";
    case "failed":
      return "bg-accent-red";
    default:
      return "bg-muted-foreground";
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function Sidebar() {
  const {
    websetList,
    websetListLoading,
    activeWebsetId,
    setWebsetList,
    setWebsetListLoading,
    setActiveWebset,
  } = useWebsetStore();
  const sidebarMode = useUiStore((s) => s.sidebarMode);
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen);
  const isRail = sidebarMode === "rail";
  const [filter, setFilter] = useState("");

  useEffect(() => {
    // Load cached history instantly so sidebar isn't empty on load
    try {
      const cached = localStorage.getItem("talist-webset-list");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWebsetList(parsed);
        }
      }
    } catch {
      // Ignore cache read errors
    }

    async function fetchWebsets() {
      setWebsetListLoading(true);
      try {
        const result = await listWebsets({ limit: 50 });
        setWebsetList(result.data);
        // Update cache
        try { localStorage.setItem("talist-webset-list", JSON.stringify(result.data)); } catch {}
      } catch (err) {
        toast.error("Failed to fetch searches");
        console.error("Failed to fetch websets:", err);
      }
      setWebsetListLoading(false);
    }
    fetchWebsets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setWebsetList, setWebsetListLoading]);

  const handleSelectWebset = async (websetId: string) => {
    try {
      const webset = await getWebset(websetId);
      setActiveWebset(webset);
    } catch (err) {
      toast.error("Failed to load search");
      console.error("Failed to load webset:", err);
    }
  };

  const runningWebsets = websetList.filter(
    (ws) => ws.status === "running" || ws.status === "pending"
  );
  const otherWebsets = websetList.filter(
    (ws) => ws.status !== "running" && ws.status !== "pending"
  );
  const filteredOther = filter
    ? otherWebsets.filter((ws) =>
        (ws.searches?.[0]?.query ?? "").toLowerCase().includes(filter.toLowerCase())
      )
    : otherWebsets;

  // ---- Rail mode (72px glass strip) ----
  if (isRail) {
    return (
      <motion.aside
        initial={false}
        animate={{ width: 72 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="h-screen glass-panel border-r border-white/10 flex flex-col items-center py-6 gap-2 shrink-0 z-50"
      >
        {/* Logo */}
        <div className="mb-6">
          <div className="w-9 h-9 rounded-lg bg-mystic/20 flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
        </div>

        {/* Nav icons */}
        <Tooltip>
          <TooltipTrigger>
            <button
              onClick={() => useWebsetStore.getState().clearActiveWebset()}
              className="p-2 text-white/40 hover:text-white transition-colors"
            >
              <Search className="h-6 w-6" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">New Search</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger>
            <button
              onClick={() => useUiStore.getState().cycleSidebarMode()}
              className="p-2 text-mystic transition-colors"
            >
              <History className="h-6 w-6" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Search History</TooltipContent>
        </Tooltip>

        <div className="flex-1" />

        {/* Settings */}
        <Tooltip>
          <TooltipTrigger>
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 text-white/40 hover:text-white transition-colors"
            >
              <Settings className="h-6 w-6" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Settings</TooltipContent>
        </Tooltip>

        {/* User avatar */}
        <div className="mt-2 w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10 text-xs font-bold text-white uppercase tracking-wider">
          JD
        </div>
      </motion.aside>
    );
  }

  // ---- Full mode (280px expanded sidebar) ----
  return (
    <motion.aside
      initial={false}
      animate={{ width: 280 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="h-screen glass-panel border-r border-white/10 flex flex-col shrink-0 overflow-hidden z-50"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-mystic/20 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-display font-extrabold text-sm text-white tracking-tight">Talist</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white/40 hover:text-white"
            onClick={() => useUiStore.getState().cycleSidebarMode()}
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Button
          variant="outline"
          className="w-full justify-start gap-2 border-white/10 text-white/60 hover:text-white text-xs h-8 bg-white/5 hover:bg-white/10"
          onClick={() => useWebsetStore.getState().clearActiveWebset()}
        >
          <Plus className="h-3.5 w-3.5" />
          New Search
        </Button>
      </div>

      {/* Search filter */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-white/40" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter searches..."
            className="pl-7 h-7 bg-transparent border-transparent text-xs focus:border-white/20 focus:bg-white/5 placeholder:text-white/30"
          />
        </div>
      </div>

      {/* Webset List */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-0.5 py-1">
          {websetListLoading && (
            <div className="px-3 py-6 text-center text-xs text-white/40">
              Loading...
            </div>
          )}
          {!websetListLoading && websetList.length === 0 && (
            <div className="px-3 py-8 text-center">
              <p className="text-xs text-white/40">No searches yet</p>
              <p className="text-[10px] text-white/20 mt-1">
                Start by searching for candidates
              </p>
            </div>
          )}

          {runningWebsets.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] uppercase tracking-widest text-white/30 px-3 py-1.5 font-semibold">
                Running
              </p>
              {runningWebsets.map((ws) => (
                <SidebarItem
                  key={ws.id}
                  ws={ws}
                  isActive={ws.id === activeWebsetId}
                  onSelect={handleSelectWebset}
                />
              ))}
            </div>
          )}

          {filteredOther.length > 0 && (
            <div>
              {runningWebsets.length > 0 && (
                <p className="text-[10px] uppercase tracking-widest text-white/30 px-3 py-1.5 font-semibold">
                  Recent
                </p>
              )}
              {filteredOther.map((ws) => (
                <SidebarItem
                  key={ws.id}
                  ws={ws}
                  isActive={ws.id === activeWebsetId}
                  onSelect={handleSelectWebset}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </motion.aside>
  );
}

function SidebarItem({
  ws,
  isActive,
  onSelect,
}: {
  ws: { id: string; status: string; searches?: Array<{ query?: string; progress?: { found?: number } }>; createdAt: string };
  isActive: boolean;
  onSelect: (id: string) => void;
}) {
  const query = ws.searches?.[0]?.query ?? "Untitled";
  const found = ws.searches?.[0]?.progress?.found ?? 0;
  const statusColor = getStatusColor(ws.status);

  return (
    <motion.button
      whileHover={{ x: 1 }}
      transition={{ duration: 0.1 }}
      onClick={() => onSelect(ws.id)}
      className={cn(
        "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
        "hover:bg-white/5",
        isActive
          ? "bg-white/5 border-l-2 border-mystic"
          : "border-l-2 border-transparent"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", statusColor)} />
        <span className="truncate text-xs font-medium flex-1 text-white/80">
          {query.length > 35 ? query.slice(0, 35) + "..." : query}
        </span>
      </div>
      <div className="flex items-center justify-between mt-1 pl-3.5">
        <span className="text-[10px] text-white/40">
          {found > 0 ? `${found} candidates` : ws.status === "running" ? "Searching..." : "No results"}
        </span>
        <span className="text-[10px] text-white/20">
          {timeAgo(ws.createdAt)}
        </span>
      </div>
    </motion.button>
  );
}
