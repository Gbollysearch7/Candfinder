"use client";

import { useEffect, useRef } from "react";
import { useWebsetStore } from "@/stores/webset-store";
import { getWebset, listItems } from "@/lib/api-client";
import { WEBSET_POLL_INTERVAL, MAX_POLL_ERRORS, ITEMS_PER_PAGE } from "@/lib/constants";

/**
 * Fetch items incrementally — only grab pages we haven't seen yet.
 * On first load or when items may have changed (enrichments updated),
 * we re-fetch everything. Otherwise we only fetch the tail.
 */
async function fetchItems(websetId: string, fullRefresh: boolean) {
  const store = useWebsetStore.getState();
  const existingCount = store.items.length;

  if (fullRefresh || existingCount === 0) {
    // Full fetch — paginate through all items
    store.setItemsLoading(true);
    try {
      let hasMore = true;
      let cursor: string | undefined;
      while (hasMore) {
        const result = await listItems(websetId, {
          limit: ITEMS_PER_PAGE,
          cursor,
        });
        store.mergeItems(result.data);
        hasMore = result.hasMore;
        cursor = result.nextCursor;
      }
    } finally {
      store.setItemsLoading(false);
    }
  } else {
    // Incremental fetch — just get the latest page to pick up new items
    // This is much faster than re-fetching all pages
    const result = await listItems(websetId, { limit: ITEMS_PER_PAGE });
    store.mergeItems(result.data);

    // If there are more pages we haven't fetched, paginate
    if (result.hasMore && result.data.length === ITEMS_PER_PAGE) {
      let cursor = result.nextCursor;
      let keepGoing = true;
      while (keepGoing) {
        const page = await listItems(websetId, { limit: ITEMS_PER_PAGE, cursor });
        store.mergeItems(page.data);
        keepGoing = page.hasMore;
        cursor = page.nextCursor;
      }
    }
  }
}

export function useWebsetPolling() {
  const activeWebsetId = useWebsetStore((s) => s.activeWebsetId);
  const status = useWebsetStore((s) => s.activeWebset?.status);

  const errorCountRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<() => Promise<void>>(undefined);
  const lastFoundRef = useRef(0);
  const isFirstPollRef = useRef(true);

  pollRef.current = async () => {
    const currentId = useWebsetStore.getState().activeWebsetId;
    if (!currentId) return;

    try {
      const webset = await getWebset(currentId);
      useWebsetStore.getState().updateActiveWebset(webset);

      // Check if the found count changed — if so, fetch new items
      const search = webset.searches?.[webset.searches.length - 1];
      const currentFound = search?.progress?.found ?? 0;
      const foundChanged = currentFound !== lastFoundRef.current;
      lastFoundRef.current = currentFound;

      // Full refresh on first poll or when enrichments might have updated
      const needsFullRefresh = isFirstPollRef.current;
      isFirstPollRef.current = false;

      // Only fetch items if count changed or first time
      if (foundChanged || needsFullRefresh) {
        await fetchItems(currentId, needsFullRefresh);
      }

      errorCountRef.current = 0;

      // Stop polling if webset is no longer running — do one final full fetch
      if (webset.status !== "running" && webset.status !== "pending") {
        await fetchItems(currentId, true); // Final full refresh for enrichment data
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch (err) {
      console.error("Polling error:", err);
      errorCountRef.current++;
      if (errorCountRef.current >= MAX_POLL_ERRORS) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }
  };

  useEffect(() => {
    if (!activeWebsetId) return;

    // Reset state for new webset
    isFirstPollRef.current = true;
    lastFoundRef.current = 0;

    // Initial fetch
    pollRef.current?.();

    // Poll if webset is running or pending
    if (status === "running" || status === "pending") {
      intervalRef.current = setInterval(() => pollRef.current?.(), WEBSET_POLL_INTERVAL);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      errorCountRef.current = 0;
    };
  }, [activeWebsetId, status]);
}
