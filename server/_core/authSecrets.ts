import { timingSafeEqual } from "node:crypto";

const warnedFallbacks = new Set<string>();

export const LEGACY_ADMIN_PASSWORD = "&&77JFR";
export const LEGACY_EDIT_PASSWORD = "&&77MAnila";
export const LEGACY_EDITOR_PASSWORD = "&&77LEica";

function readAuthSecret(envName: string, legacyValue: string): string {
  const configuredValue = process.env[envName];
  if (configuredValue !== undefined) {
    return configuredValue;
  }

  if (!warnedFallbacks.has(envName)) {
    warnedFallbacks.add(envName);
    console.warn(
      `[Auth] WARNING: ${envName} not set in environment — using legacy hardcoded default. Set this env var and rotate the value.`
    );
  }

  return legacyValue;
}

function matchesSecret(candidate: string, secret: string): boolean {
  const candidateBuffer = Buffer.from(candidate);
  const secretBuffer = Buffer.from(secret);

  if (candidateBuffer.length !== secretBuffer.length) {
    return false;
  }

  return timingSafeEqual(candidateBuffer, secretBuffer);
}

export const ADMIN_PASSWORD = readAuthSecret("ADMIN_PASSWORD", LEGACY_ADMIN_PASSWORD);
export const EDIT_PASSWORD = readAuthSecret("EDIT_PASSWORD", LEGACY_EDIT_PASSWORD);
export const EDITOR_PASSWORD = readAuthSecret("EDITOR_PASSWORD", LEGACY_EDITOR_PASSWORD);

export function isAdminPassword(password: string): boolean {
  return matchesSecret(password, ADMIN_PASSWORD);
}

export function isAuthorized(password: string): boolean {
  const adminMatch = matchesSecret(password, ADMIN_PASSWORD);
  const editMatch = matchesSecret(password, EDIT_PASSWORD);

  return adminMatch || editMatch;
}

export function verifyEditorPassword(password: string): boolean {
  const editorMatch = matchesSecret(password, EDITOR_PASSWORD);
  const editMatch = matchesSecret(password, EDIT_PASSWORD);

  return editorMatch || editMatch;
}
