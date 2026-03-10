"use client";

import { useState } from "react";
import { SearchComposer } from "./search-composer";
import { useWebsetStore } from "@/stores/webset-store";
import { getWebset } from "@/lib/api-client";
import { StatusBadge } from "@/components/shared/status-badge";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const EXAMPLE_QUERIES = [
  "ML engineers in SF with PyTorch experience",
  "Senior designers at Y Combinator startups",
  "Founding engineers who've built AI products",
  "DevOps engineers with Kubernetes expertise",
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export function SearchEmptyState() {
  const [initialQuery, setInitialQuery] = useState("");
  const websetList = useWebsetStore((s) => s.websetList);
  const setActiveWebset = useWebsetStore((s) => s.setActiveWebset);

  const isReturningUser = websetList.length > 0;
  const recentWebsets = websetList.slice(0, 4);

  const handleSelectWebset = async (websetId: string) => {
    try {
      const webset = await getWebset(websetId);
      setActiveWebset(webset);
    } catch (err) {
      toast.error("Failed to load search");
      console.error("Failed to load webset:", err);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start pt-20 px-6 md:px-12 relative z-10">
      {/* Hero heading — Syne display font */}
      <h1 className="font-display text-4xl md:text-5xl font-extrabold italic tracking-tight mb-12 text-center text-white">
        Find any candidates
      </h1>

      {/* Search Composer */}
      <div className="w-full max-w-3xl">
        <SearchComposer initialQuery={initialQuery} />
      </div>

      {/* Return visit: Recent searches */}
      {isReturningUser && (
        <section className="w-full max-w-5xl mt-20">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest">
              Recent searches
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentWebsets.map((ws, i) => {
              const query = ws.searches?.[0]?.query ?? "Untitled";
              const found = ws.searches?.[0]?.progress?.found ?? 0;

              return (
                <motion.button
                  key={ws.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                  onClick={() => handleSelectWebset(ws.id)}
                  className="text-left p-5 rounded-xl glass-panel hover:bg-white/5 transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <StatusBadge status={ws.status} />
                    <span className="text-white/30 text-[10px] font-medium uppercase">
                      {timeAgo(ws.createdAt)}
                    </span>
                  </div>
                  <p className="text-white/80 text-sm line-clamp-2 mb-4 group-hover:text-white transition-colors font-medium">
                    {query}
                  </p>
                  {found > 0 && (
                    <div className="flex items-center gap-2 text-white/40 text-xs">
                      <Users className="h-3.5 w-3.5" />
                      <span>{found} candidate{found !== 1 ? "s" : ""}</span>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </section>
      )}

      {/* First visit: Example queries */}
      {!isReturningUser && (
        <div className="text-center mt-12">
          <p className="text-[10px] uppercase tracking-widest text-white/30 mb-3 font-semibold">
            Try an example
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLE_QUERIES.map((example) => (
              <button
                key={example}
                className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-mystic/40 hover:bg-mystic/5 transition-colors"
                onClick={() => setInitialQuery(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
