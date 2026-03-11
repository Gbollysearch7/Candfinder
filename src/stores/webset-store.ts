"use client";

import { create } from "zustand";
import type { Webset, WebsetItem, Enrichment, Search } from "@/lib/exa-types";

interface WebsetState {
  activeWebset: Webset | null;
  activeWebsetId: string | null;
  items: WebsetItem[];
  itemsLoading: boolean;
  websetList: Webset[];
  websetListLoading: boolean;
  isSearching: boolean;
  searchError: string | null;

  setActiveWebset: (webset: Webset) => void;
  updateActiveWebset: (webset: Webset) => void;
  clearActiveWebset: () => void;
  setItems: (items: WebsetItem[]) => void;
  mergeItems: (items: WebsetItem[]) => void;
  setItemsLoading: (loading: boolean) => void;
  setWebsetList: (list: Webset[]) => void;
  setWebsetListLoading: (loading: boolean) => void;
  addEnrichment: (enrichment: Enrichment) => void;
  removeEnrichment: (enrichmentId: string) => void;
  addSearch: (search: Search) => void;
  setIsSearching: (searching: boolean) => void;
  setSearchError: (error: string | null) => void;
}

export const useWebsetStore = create<WebsetState>((set, get) => ({
  activeWebset: null,
  activeWebsetId: null,
  items: [],
  itemsLoading: false,
  websetList: [],
  websetListLoading: false,
  isSearching: false,
  searchError: null,

  setActiveWebset: (webset) =>
    set({ activeWebset: webset, activeWebsetId: webset.id, items: [], searchError: null }),

  updateActiveWebset: (webset) =>
    set({ activeWebset: webset }),

  clearActiveWebset: () =>
    set({ activeWebset: null, activeWebsetId: null, items: [] }),

  setItems: (items) => set({ items }),

  mergeItems: (newItems) => {
    const existing = get().items;
    const newMap = new Map(newItems.map((i) => [i.id, i]));
    const updated = existing.map((item) => newMap.get(item.id) ?? item);
    const existingIds = new Set(existing.map((i) => i.id));
    const fresh = newItems.filter((i) => !existingIds.has(i.id));
    set({ items: [...updated, ...fresh] });
  },

  setItemsLoading: (loading) => set({ itemsLoading: loading }),

  setWebsetList: (list) => set({ websetList: list }),
  setWebsetListLoading: (loading) => set({ websetListLoading: loading }),

  addEnrichment: (enrichment) => {
    const ws = get().activeWebset;
    if (!ws) return;
    set({
      activeWebset: {
        ...ws,
        enrichments: [...ws.enrichments, enrichment],
      },
    });
  },

  removeEnrichment: (enrichmentId) => {
    const ws = get().activeWebset;
    if (!ws) return;
    set({
      activeWebset: {
        ...ws,
        enrichments: ws.enrichments.filter((e) => e.id !== enrichmentId),
      },
    });
  },

  addSearch: (search) => {
    const ws = get().activeWebset;
    if (!ws) return;
    // Add the new search and set webset back to running so polling restarts
    set({
      activeWebset: {
        ...ws,
        searches: [...ws.searches, search],
        status: "running",
      },
    });
  },

  setIsSearching: (searching) => set({ isSearching: searching }),
  setSearchError: (error) => set({ searchError: error }),
}));
