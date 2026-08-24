const DEFAULT_SUPABASE_URL = "https://frgdgcpmrshimyxsamdr.supabase.co";

export function normalizeBaseUrl(raw: string): string {
  let end = raw.length;
  while (end > 0 && raw.charCodeAt(end - 1) === 47) {
    end -= 1;
  }
  return raw.slice(0, end);
}

export function getSupabaseBaseUrl(options?: {
  includeViteSupabaseUrl?: boolean;
  fallback?: string;
}): string {
  const includeViteSupabaseUrl = options?.includeViteSupabaseUrl ?? true;
  const fallback = options?.fallback ?? "";

  const raw =
    process.env.SUPABASE_URL ||
    (includeViteSupabaseUrl ? process.env.VITE_SUPABASE_URL : undefined) ||
    fallback;

  return normalizeBaseUrl(raw);
}

export function getDefaultSupabaseBaseUrl(): string {
  return getSupabaseBaseUrl({ fallback: DEFAULT_SUPABASE_URL });
}

export function joinUrl(base: string, ...segments: string[]): string {
  const normalizedBase = normalizeBaseUrl(base);
  const normalizedSegments = segments
    .map((segment) => collapseRepeatedSlashes(trimSlashes(segment)))
    .filter((segment) => segment.length > 0);

  if (!normalizedBase) {
    return normalizedSegments.length > 0 ? `/${normalizedSegments.join("/")}` : "";
  }

  return normalizedSegments.length > 0
    ? `${normalizedBase}/${normalizedSegments.join("/")}`
    : normalizedBase;
}

function trimSlashes(value: string): string {
  let start = 0;
  let end = value.length;

  while (start < end && value.charCodeAt(start) === 47) {
    start += 1;
  }
  while (end > start && value.charCodeAt(end - 1) === 47) {
    end -= 1;
  }

  return value.slice(start, end);
}

function collapseRepeatedSlashes(value: string): string {
  let output = "";
  let previousWasSlash = false;

  for (const char of value) {
    if (char === "/") {
      if (previousWasSlash) {
        continue;
      }
      previousWasSlash = true;
      output += char;
      continue;
    }

    previousWasSlash = false;
    output += char;
  }

  return output;
}
