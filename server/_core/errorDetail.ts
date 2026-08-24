const ERROR_DETAIL_FIELDS = [
  "name",
  "code",
  "errno",
  "syscall",
  "severity",
  "routine",
  "detail",
  "constraint",
  "hint",
  "schema",
  "table",
  "column",
  "address",
  "port",
  "message",
] as const;

type ErrorDetailField = (typeof ERROR_DETAIL_FIELDS)[number];

type ErrorDetailMap = Partial<Record<ErrorDetailField, string>>;

export type ErrorCauseLevel = {
  index: number;
  details: ErrorDetailMap;
};

const CONNECTION_ERROR_CODES = new Set([
  "ENOTFOUND",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "ENETUNREACH",
  "EAI_AGAIN",
  "CONNECT_TIMEOUT",
  "DB_UNAVAILABLE",
]);

const AUTH_SQLSTATE_CODES = new Set(["28P01", "28000", "3D000"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sanitizeValue(value: string): string {
  return value
    .replace(/(postgres(?:ql)?:\/\/[^:\s@\/]+:)([^@\s]+)@/gi, "$1***@")
    .replace(/(\bpassword\s*=\s*)([^,\s;]+)/gi, "$1***");
}

function readField(obj: Record<string, unknown>, key: ErrorDetailField): string | undefined {
  const value = obj[key];
  if (typeof value === "string") return sanitizeValue(value);
  if (typeof value === "number") return String(value);
  return undefined;
}

export function getErrorCauseLevels(error: unknown, maxDepth: number = 5): ErrorCauseLevel[] {
  const levels: ErrorCauseLevel[] = [];
  const seen = new Set<object>();
  let current: unknown = error;

  for (let depth = 0; depth < maxDepth; depth += 1) {
    if (!isRecord(current)) break;
    if (seen.has(current)) break;
    seen.add(current);

    const details: ErrorDetailMap = {};
    for (const field of ERROR_DETAIL_FIELDS) {
      const value = readField(current, field);
      if (value !== undefined) details[field] = value;
    }

    levels.push({ index: depth, details });
    current = current.cause;
  }

  return levels;
}

function formatDetailKey(key: ErrorDetailField): string {
  return key === "message" ? "msg" : key;
}

export function logErrorCauseChain(prefix: string, error: unknown, maxDepth: number = 5): ErrorCauseLevel[] {
  const levels = getErrorCauseLevels(error, maxDepth);
  console.error(prefix);

  if (levels.length === 0) {
    console.error("  cause[0]: <non-object error>");
    return levels;
  }

  for (const level of levels) {
    const parts = ERROR_DETAIL_FIELDS
      .filter((field): field is ErrorDetailField => level.details[field] !== undefined)
      .map((field) => `${formatDetailKey(field)}=${level.details[field]}`);

    const detailText = parts.length > 0 ? parts.join(" ") : "<no details>";
    console.error(`  cause[${level.index}]: ${detailText}`);
  }

  return levels;
}

export function findSqlStateCode(levels: ErrorCauseLevel[]): string | undefined {
  for (const level of levels) {
    const code = level.details.code;
    if (code !== undefined && /^[0-9A-Z]{5}$/i.test(code)) {
      return code.toUpperCase();
    }
  }

  return undefined;
}

export function isDbUnavailableCause(levels: ErrorCauseLevel[]): boolean {
  for (const level of levels) {
    const code = level.details.code?.toUpperCase();
    if (code !== undefined && CONNECTION_ERROR_CODES.has(code)) {
      return true;
    }

    const severity = level.details.severity?.toUpperCase();
    if (severity === "FATAL" && code !== undefined && AUTH_SQLSTATE_CODES.has(code)) {
      return true;
    }
  }

  return false;
}
