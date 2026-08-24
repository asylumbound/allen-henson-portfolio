const DEFAULT_SUPABASE_URL = "https://frgdgcpmrshimyxsamdr.supabase.co";

export function normalizeBaseUrl(raw: string): string {
  return raw.replace(/\/+$/, "");
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
    .map((segment) =>
      segment
        .replace(/^\/+/, "")
        .replace(/\/+$/, "")
        .replace(/\/{2,}/g, "/")
    )
    .filter((segment) => segment.length > 0);

  if (!normalizedBase) {
    return normalizedSegments.length > 0 ? `/${normalizedSegments.join("/")}` : "";
  }

  return normalizedSegments.length > 0
    ? `${normalizedBase}/${normalizedSegments.join("/")}`
    : normalizedBase;
}
