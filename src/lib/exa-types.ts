// ============================================
// Exa Websets API Types — matched to real API
// ============================================

export type WebsetStatus = "idle" | "pending" | "running" | "paused";
export type EnrichmentFormat = "text" | "number" | "date" | "email" | "phone" | "url" | "options";
export type EntityType = "person" | "company" | "article" | "research_paper" | "custom";
export type SearchStatus = "created" | "pending" | "running" | "completed" | "canceled";
export type EnrichmentStatus = "pending" | "running" | "completed" | "canceled";
export type ItemEnrichmentStatus = "pending" | "completed" | "canceled";

// ---- Exclusion Types ----

export interface ExcludeRef {
  source: "webset" | "import";
  id: string;
}

// ---- Request Types ----

export interface CreateWebsetPayload {
  search: {
    query: string;
    entity?: { type: EntityType };
    criteria?: Array<{ description: string }>;
    count?: number;
    exclude?: ExcludeRef[];
  };
  exclude?: ExcludeRef[];
  enrichments?: Array<{
    description: string;
    format: EnrichmentFormat;
    options?: Array<{ label: string }>;
  }>;
  externalId?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateEnrichmentPayload {
  description: string;
  format: EnrichmentFormat;
  options?: Array<{ label: string }>;
}

// ---- Response Types ----

export interface Webset {
  id: string;
  object: "webset";
  status: WebsetStatus;
  title?: string | null;
  externalId?: string | null;
  searches: Search[];
  enrichments: Enrichment[];
  imports: unknown[];
  monitors: unknown[];
  excludes: ExcludeRef[];
  metadata?: Record<string, unknown>;
  dashboardUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Search {
  id: string;
  object: "webset_search";
  websetId: string;
  query: string;
  entity?: { type: EntityType };
  criteria: Criterion[];
  count: number;
  status: SearchStatus;
  behavior?: string;
  exclude?: ExcludeRef[];
  scope?: unknown[];
  progress?: {
    found: number;
    analyzed: number;
    completion: number;
    timeLeft: number | null;
  };
  recall?: unknown;
  metadata?: Record<string, unknown>;
  canceledAt?: string | null;
  canceledReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Criterion {
  description: string;
  successRate?: number;
}

export interface Enrichment {
  id: string;
  object: "webset_enrichment";
  description: string;
  format: EnrichmentFormat;
  options?: Array<{ label: string }>;
  status: EnrichmentStatus;
  createdAt: string;
  updatedAt: string;
}

// ---- Item types (matched to real API response) ----

export interface PersonProperties {
  type: "person";
  url: string;
  description?: string;
  person?: {
    name?: string;
    location?: string;
    position?: string;
    company?: {
      name?: string;
      location?: string;
    };
    pictureUrl?: string;
    workHistory?: Array<{
      title: string;
      location?: string | null;
      dates?: { from?: string | null; to?: string | null };
      company?: { id?: string | null; name?: string; linkedinUrl?: string | null };
    }>;
    educationHistory?: Array<{
      degree?: string;
      dates?: unknown;
      institution?: { id?: string | null; name?: string; linkedinUrl?: string | null };
    }>;
  };
}

export interface ItemEvaluation {
  criterion: string;
  reasoning?: string;
  satisfied: "yes" | "no" | "unknown";
  references?: Array<{
    title?: string | null;
    snippet?: string | null;
    url: string;
  }>;
}

export interface EnrichmentResult {
  object: "enrichment_result";
  enrichmentId: string;
  status: ItemEnrichmentStatus;
  format: EnrichmentFormat;
  result: string[] | null;
  reasoning?: string | null;
  references?: Array<{
    title?: string | null;
    snippet?: string | null;
    url: string;
  }>;
}

export interface WebsetItem {
  id: string;
  object: "webset_item";
  source: string;
  sourceId: string;
  websetId: string;
  properties: PersonProperties | Record<string, unknown>;
  evaluations: ItemEvaluation[];
  enrichments: EnrichmentResult[];
  createdAt: string;
  updatedAt: string;
}

// ---- Helpers ----

/** Get display name from a webset item */
export function getItemName(item: WebsetItem): string {
  const props = item.properties as PersonProperties;
  if (props.type === "person" && props.person?.name) return props.person.name;
  if (typeof props.description === "string")
    return props.description.slice(0, 60);
  return "Unknown";
}

/** Get display URL from a webset item */
export function getItemUrl(item: WebsetItem): string {
  const props = item.properties as PersonProperties;
  if (typeof props.url === "string") return props.url;
  return "";
}

/** Get item description */
export function getItemDescription(item: WebsetItem): string {
  const props = item.properties as PersonProperties;
  if (typeof props.description === "string")
    return props.description;
  return "";
}

/** Get person's current position/job title */
export function getItemPosition(item: WebsetItem): string {
  const props = item.properties as PersonProperties;
  return props.person?.position ?? "";
}

/** Get person's location */
export function getItemLocation(item: WebsetItem): string {
  const props = item.properties as PersonProperties;
  return props.person?.location ?? "";
}

/** Get person's current company name */
export function getItemCompany(item: WebsetItem): string {
  const props = item.properties as PersonProperties;
  return props.person?.company?.name ?? "";
}

/** Get person's profile picture URL */
export function getItemPictureUrl(item: WebsetItem): string {
  const props = item.properties as PersonProperties;
  return props.person?.pictureUrl ?? "";
}

/** Find enrichment result for a given enrichment ID */
export function findEnrichmentResult(
  item: WebsetItem,
  enrichmentId: string
): EnrichmentResult | undefined {
  return item.enrichments?.find((r) => r.enrichmentId === enrichmentId);
}

/** Get enrichment display value */
export function getEnrichmentValue(result: EnrichmentResult | undefined): string | null {
  if (!result || !result.result || result.result.length === 0) return null;
  return result.result.join(", ");
}

// ---- Pagination ----

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface ListWebsetsParams {
  cursor?: string;
  limit?: number;
}

export interface ListItemsParams {
  cursor?: string;
  limit?: number;
  sourceId?: string;
}
