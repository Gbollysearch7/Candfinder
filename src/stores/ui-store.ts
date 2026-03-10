"use client";

import { create } from "zustand";
import { useWebsetStore } from "@/stores/webset-store";

type SidebarMode = "full" | "rail";

interface UiState {
  sidebarMode: SidebarMode;
  detailPanelOpen: boolean;
  selectedItemId: string | null;
  settingsOpen: boolean;
  addColumnOpen: boolean;
  selectedRowIds: Set<string>;
  exportDialogOpen: boolean;

  // Sidebar — backward-compat getters as actions
  cycleSidebarMode: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Detail panel
  openDetail: (itemId: string) => void;
  closeDetail: () => void;
  navigateDetail: (direction: "prev" | "next") => void;

  // Dialogs
  setSettingsOpen: (open: boolean) => void;
  setAddColumnOpen: (open: boolean) => void;
  setExportDialogOpen: (open: boolean) => void;

  // Row selection
  toggleRowSelection: (id: string) => void;
  selectAllRows: (ids: string[]) => void;
  clearSelection: () => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  sidebarMode: "rail",
  detailPanelOpen: false,
  selectedItemId: null,
  settingsOpen: false,
  addColumnOpen: false,
  selectedRowIds: new Set(),
  exportDialogOpen: false,

  cycleSidebarMode: () =>
    set((s) => ({
      sidebarMode: s.sidebarMode === "full" ? "rail" : "full",
    })),

  setSidebarOpen: (open) =>
    set({ sidebarMode: open ? "full" : "rail" }),

  openDetail: (itemId) =>
    set({ detailPanelOpen: true, selectedItemId: itemId }),

  closeDetail: () =>
    set({ detailPanelOpen: false, selectedItemId: null }),

  navigateDetail: (direction) => {
    const { selectedItemId } = get();
    if (!selectedItemId) return;
    const items = useWebsetStore.getState().items;
    const currentIndex = items.findIndex((i) => i.id === selectedItemId);
    if (currentIndex === -1) return;
    const nextIndex =
      direction === "next"
        ? Math.min(currentIndex + 1, items.length - 1)
        : Math.max(currentIndex - 1, 0);
    if (nextIndex !== currentIndex) {
      set({ selectedItemId: items[nextIndex].id });
    }
  },

  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setAddColumnOpen: (open) => set({ addColumnOpen: open }),
  setExportDialogOpen: (open) => set({ exportDialogOpen: open }),

  toggleRowSelection: (id) =>
    set((s) => {
      const next = new Set(s.selectedRowIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedRowIds: next };
    }),

  selectAllRows: (ids) =>
    set({ selectedRowIds: new Set(ids) }),

  clearSelection: () =>
    set({ selectedRowIds: new Set() }),
}));

// Backward-compat helpers used by sidebar.tsx and header.tsx
// These read from sidebarMode to derive the old boolean
export function useSidebarCompat() {
  const sidebarMode = useUiStore((s) => s.sidebarMode);
  return {
    sidebarOpen: sidebarMode === "full",
    toggleSidebar: useUiStore.getState().cycleSidebarMode,
  };
}
