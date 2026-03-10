import type {
  CreateWebsetPayload,
  CreateEnrichmentPayload,
  Webset,
  WebsetItem,
  Enrichment,
  PaginatedResponse,
  ListWebsetsParams,
  ListItemsParams,
} from "./exa-types";
import { toast } from "sonner";

class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown
  ) {
    super(`API error ${status}`);
  }
}

async function apiFetch<T>(
  path: string,
  options?: { method?: string; body?: unknown }
): Promise<T> {
  const res = await fetch(`/api/exa${path}`, {
    method: options?.method ?? "GET",
    headers: { "Content-Type": "application/json" },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    // Rate limit detection
    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      const parsed = retryAfter ? parseInt(retryAfter, 10) : NaN;
      const seconds = Number.isNaN(parsed) ? 60 : parsed;
      toast.error(`Rate limited — try again in ${seconds}s`);
    }

    const error = await res.json().catch(() => ({}));
    throw new ApiError(res.status, error);
  }

  return res.json() as Promise<T>;
}

// ---- Websets ----

export function createWebset(payload: CreateWebsetPayload) {
  return apiFetch<Webset>("/websets", { method: "POST", body: payload });
}

export function getWebset(websetId: string) {
  return apiFetch<Webset>(`/websets/${websetId}`);
}

export function listWebsets(params?: ListWebsetsParams) {
  const qs = new URLSearchParams();
  if (params?.cursor) qs.set("cursor", params.cursor);
  if (params?.limit) qs.set("limit", String(params.limit));
  const query = qs.toString();
  return apiFetch<PaginatedResponse<Webset>>(
    `/websets${query ? `?${query}` : ""}`
  );
}

export function deleteWebset(websetId: string) {
  return apiFetch<void>(`/websets/${websetId}`, { method: "DELETE" });
}

export function cancelWebset(websetId: string) {
  return apiFetch<Webset>(`/websets/${websetId}/cancel`, { method: "POST" });
}

// ---- Items ----

export function listItems(websetId: string, params?: ListItemsParams) {
  const qs = new URLSearchParams();
  if (params?.cursor) qs.set("cursor", params.cursor);
  if (params?.limit) qs.set("limit", String(params.limit));
  const query = qs.toString();
  return apiFetch<PaginatedResponse<WebsetItem>>(
    `/websets/${websetId}/items${query ? `?${query}` : ""}`
  );
}

export function getItem(websetId: string, itemId: string) {
  return apiFetch<WebsetItem>(`/websets/${websetId}/items/${itemId}`);
}

// ---- Enrichments ----

export function createEnrichment(
  websetId: string,
  payload: CreateEnrichmentPayload
) {
  return apiFetch<Enrichment>(`/websets/${websetId}/enrichments`, {
    method: "POST",
    body: payload,
  });
}

export function getEnrichment(websetId: string, enrichmentId: string) {
  return apiFetch<Enrichment>(
    `/websets/${websetId}/enrichments/${enrichmentId}`
  );
}

export function deleteEnrichment(websetId: string, enrichmentId: string) {
  return apiFetch<void>(
    `/websets/${websetId}/enrichments/${enrichmentId}`,
    { method: "DELETE" }
  );
}
