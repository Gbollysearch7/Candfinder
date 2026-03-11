/**
 * Parses a natural language search query into structured criteria for the Exa API.
 *
 * Example: "Senior React developers in Berlin with 5+ years experience"
 * → [
 *     "Must be a Senior React developer",
 *     "Based in Berlin",
 *     "Has 5+ years of experience"
 *   ]
 */

// Location patterns — matches "in <City>", "from <City>", "based in <City>"
const LOCATION_PATTERN =
  /\b(?:in|from|based in|located in|living in)\s+([A-Z][a-zA-Z\s]+(?:,\s*[A-Z][a-zA-Z\s]+)?)/i;

// Experience patterns — matches "5+ years", "3-5 years experience", "at least 5 years"
const EXPERIENCE_PATTERN =
  /(\d+\+?\s*(?:-\s*\d+)?\s*years?\s*(?:of\s+)?(?:experience|exp)?)/i;

// "with" clauses — matches "with PyTorch experience", "with expertise in AI"
const WITH_PATTERN =
  /\bwith\s+(.+?)(?:\s+(?:in|at|from|based|who|and\s+\d)|\s*$)/i;

// "who" clauses — matches "who worked at Google", "who have built AI products"
const WHO_PATTERN =
  /\bwho(?:'ve|'s|\s+have|\s+has|\s+are|\s+is|\s+can)?\s+(.+?)(?:\s+(?:in|at|from|based|with)|\s*$)/i;

// "at" company — matches "at Google", "at Y Combinator startups"
const AT_COMPANY_PATTERN =
  /\bat\s+([A-Z][a-zA-Z\s&]+?)(?:\s+(?:in|from|based|with|who|and\s+\d)|\s*$)/i;

// Role extraction — the core noun phrase before location/qualification modifiers
const ROLE_MODIFIERS = /\b(?:in|from|based|located|with|who|at)\b/i;

/**
 * Extracts a result count number from the query if the user specified one.
 * E.g. "50 professionals in Hong Kong" → 50
 *      "Find 100 software engineers" → 100
 */
export function parseCountFromQuery(query: string): number | null {
  // Match patterns like "50 professionals", "find 100 developers", "10 people"
  const match = query.match(
    /\b(\d{1,4})\s+(?:professionals?|people|persons?|candidates?|developers?|engineers?|designers?|managers?|analysts?|leads?|directors?|executives?|specialists?|consultants?|experts?)/i
  );
  if (match) {
    const n = parseInt(match[1], 10);
    if (n >= 1 && n <= 1000) return n;
  }
  return null;
}

/**
 * Generates enrichment column suggestions from a search query.
 * These become soft "match/unmatch" columns (NOT hard-filter criteria).
 *
 * Example: "50 Banking professionals in Hong Kong who worked on WeChat ecosystem"
 * → [
 *     { description: "Has experience in Banking / financial services", format: "boolean" },
 *     { description: "Has worked on WeChat ecosystem related projects", format: "boolean" },
 *   ]
 */
export interface EnrichmentSuggestion {
  description: string;
  format: "text" | "boolean";
  label: string; // short column header
}

export function parseQueryToEnrichments(query: string): EnrichmentSuggestion[] {
  const suggestions: EnrichmentSuggestion[] = [];
  const trimmed = query.trim();
  if (!trimmed) return suggestions;

  // Extract "who" clauses → enrichment
  const whoMatch = trimmed.match(WHO_PATTERN);
  if (whoMatch) {
    const clause = whoMatch[1].trim();
    if (clause.length > 3) {
      suggestions.push({
        description: `Has this person ${clause}? Answer yes or no with brief evidence.`,
        format: "text",
        label: clause.slice(0, 30),
      });
    }
  }

  // Extract "with" qualifications → enrichment
  const withMatch = trimmed.match(WITH_PATTERN);
  if (withMatch) {
    let qual = withMatch[1].trim();
    if (!EXPERIENCE_PATTERN.test(qual) && qual.length > 3) {
      qual = qual.replace(/\s+experience$/i, " experience");
      suggestions.push({
        description: `Does this person have ${qual}? Answer yes or no with brief evidence.`,
        format: "text",
        label: qual.slice(0, 30),
      });
    }
  }

  // Extract experience requirement → enrichment
  const expMatch = trimmed.match(EXPERIENCE_PATTERN);
  if (expMatch) {
    suggestions.push({
      description: `Does this person have ${expMatch[1].trim()}? Answer yes or no with evidence.`,
      format: "text",
      label: `${expMatch[1].trim()}`,
    });
  }

  // Extract "at <Company>" → enrichment
  const atMatch = trimmed.match(AT_COMPANY_PATTERN);
  if (atMatch) {
    const company = atMatch[1].trim();
    if (company.length > 2 && !/^(least|most|a\s|the\s)/i.test(company)) {
      suggestions.push({
        description: `Has this person worked at ${company}? Answer yes or no with role details.`,
        format: "text",
        label: company.slice(0, 30),
      });
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return suggestions.filter((s) => {
    const key = s.description.toLowerCase().slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 5);
}
