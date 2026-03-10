"use client";

import { useEffect, useRef } from "react";
import { useWebsetStore } from "@/stores/webset-store";
import { getWebset, listItems } from "@/lib/api-client";
import { WEBSET_POLL_INTERVAL, MAX_POLL_ERRORS, ITEMS_PER_PAGE } from "@/lib/constants";

async function fetchAllItems(websetId: string) {
  useWebsetStore.getState().setItemsLoading(true);
  try {
    let hasMore = true;
    let cursor: string | undefined;
    while (hasMore) {
      const result = await listItems(websetId, {
        limit: ITEMS_PER_PAGE,
        cursor,
      });
      useWebsetStore.getState().mergeItems(result.data);
      hasMore = result.hasMore;
      cursor = result.nextCursor;
    }
  } finally {
    useWebsetStore.getState().setItemsLoading(false);
  }
}

export function useWebsetPolling() {
  const activeWebsetId = useWebsetStore((s) => s.activeWebsetId);
  const status = useWebsetStore((s) => s.activeWebset?.status);

  const errorCountRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<() => Promise<void>>(undefined);

  pollRef.current = async () => {
    const currentId = useWebsetStore.getState().activeWebsetId;
    if (!currentId) return;

    try {
      const webset = await getWebset(currentId);
      useWebsetStore.getState().updateActiveWebset(webset);

      await fetchAllItems(currentId);
      errorCountRef.current = 0;

      // Stop polling if webset is no longer running — do one final fetch
      if (webset.status !== "running" && webset.status !== "pending") {
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
