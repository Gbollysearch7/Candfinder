"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { SettingsDialog } from "./settings-dialog";
import { SearchEmptyState } from "@/components/search/search-empty-state";
import { SearchInProgress } from "@/components/search/search-in-progress";
import { CandidatesTable } from "@/components/table/candidates-table";
import { CriteriaPanel } from "@/components/table/criteria-panel";
import { CandidateDetailPanel } from "@/components/detail/candidate-detail-panel";
import { ExportDialog } from "@/components/table/export-dialog";
import { useWebsetStore } from "@/stores/webset-store";
import { useWebsetPolling } from "@/hooks/use-webset-polling";
import { AnimatePresence, motion } from "framer-motion";

export function AppShell() {
  const { activeWebset, items } = useWebsetStore();

  useWebsetPolling();

  const status = activeWebset?.status;
  // Show progress screen only for the initial search (no items yet).
  // If we already have items (e.g. "find more" or "refine"), keep showing the table.
  const showSearchInProgress =
    activeWebset &&
    (status === "running" || status === "pending") &&
    items.length === 0;

  const viewKey = !activeWebset
    ? "empty"
    : showSearchInProgress
      ? "progress"
      : "table";

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <AnimatePresence mode="wait">
          {viewKey === "empty" && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <SearchEmptyState />
            </motion.div>
          )}
          {viewKey === "progress" && (
            <motion.div
              key="progress"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <SearchInProgress />
            </motion.div>
          )}
          {viewKey === "table" && (
            <motion.div
              key="table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <Header />
              <div className="flex-1 flex min-h-0">
                <CandidatesTable />
                <CriteriaPanel />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <CandidateDetailPanel />
      <ExportDialog />
      <SettingsDialog />
    </div>
  );
}
