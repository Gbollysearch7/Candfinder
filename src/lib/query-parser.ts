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

export function parseQueryToCriteria(query: string): string[] {
  const criteria: string[] = [];
  const trimmed = query.trim();
  if (!trimmed) return criteria;

  // 1. Extract the role (everything before the first modifier)
  const modifierMatch = trimmed.search(ROLE_MODIFIERS);
  const rolePart = modifierMatch > 0 ? trimmed.slice(0, modifierMatch).trim() : trimmed;

  if (rolePart && rolePart.length > 3) {
    // Clean up: remove trailing "s" duplication, normalize
    const role = rolePart.replace(/\s+/g, " ").trim();
    criteria.push(`Must be a ${role}`);
  }

  // 2. Extract location
  const locationMatch = trimmed.match(LOCATION_PATTERN);
  if (locationMatch) {
    const location = locationMatch[1].trim().replace(/\s+with.*$/i, "").replace(/\s+who.*$/i, "");
    if (location.length > 1) {
      criteria.push(`Based in ${location}`);
    }
  }

  // 3. Extract experience requirement
  const expMatch = trimmed.match(EXPERIENCE_PATTERN);
  if (expMatch) {
    criteria.push(`Has ${expMatch[1].trim()}`);
  }

  // 4. Extract "with" qualifications
  const withMatch = trimmed.match(WITH_PATTERN);
  if (withMatch) {
    let qual = withMatch[1].trim();
    // Don't duplicate if it's just the experience we already captured
    if (!EXPERIENCE_PATTERN.test(qual)) {
      // Clean up trailing noise
      qual = qual.replace(/\s+experience$/i, " experience");
      if (qual.length > 3) {
        criteria.push(`Has ${qual}`);
      }
    }
  }

  // 5. Extract "who" clauses
  const whoMatch = trimmed.match(WHO_PATTERN);
  if (whoMatch) {
    const whoClause = whoMatch[1].trim();
    if (whoClause.length > 3) {
      criteria.push(`Must have ${whoClause}`);
    }
  }

  // 6. Extract "at <Company>" if present
  const atMatch = trimmed.match(AT_COMPANY_PATTERN);
  if (atMatch) {
    const company = atMatch[1].trim();
    // Avoid matching "at least", "at fintech" etc.
    if (company.length > 2 && !/^(least|most|a\s|the\s)/i.test(company)) {
      criteria.push(`Currently or previously worked at ${company}`);
    }
  }

  // Deduplicate — if criteria are too similar, remove duplicates
  const unique = criteria.filter((c, i, arr) => {
    for (let j = 0; j < i; j++) {
      // If one criterion is a substring of another, skip the shorter one
      if (arr[j].toLowerCase().includes(c.toLowerCase().slice(0, 20))) return false;
      if (c.toLowerCase().includes(arr[j].toLowerCase().slice(0, 20))) return false;
    }
    return true;
  });

  return unique.slice(0, 5); // Max 5 criteria
}
