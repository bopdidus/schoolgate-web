/**
 * Minimal, dependency-free JWT payload reader. We only ever need the `exp`
 * claim for a purely client-side UX optimisation (proactive refresh / avoiding
 * doomed requests) — that doesn't justify pulling in a package like
 * `jwt-decode` for what is a ~10-line base64url decode.
 *
 * IMPORTANT: this performs NO signature verification. It must never be used
 * for authorization decisions — the server is always the source of truth.
 */
export interface JwtPayload {
  exp?: number;
  [claim: string]: unknown;
}

function base64UrlToBase64(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const paddingNeeded = (4 - (base64.length % 4)) % 4;
  return base64 + '='.repeat(paddingNeeded);
}

/** Returns the decoded payload, or `null` if `token` isn't a well-formed JWT. */
export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const decodedBytes = atob(base64UrlToBase64(parts[1]));
    // atob() yields a binary string; re-encode byte-by-byte to percent-escapes
    // so decodeURIComponent can turn it back into proper UTF-8 (JWT claims may
    // contain non-ASCII text, e.g. accented names).
    const json = decodeURIComponent(
      decodedBytes
        .split('')
        .map((char) => '%' + char.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/** Returns the token's expiry as epoch milliseconds, or `null` if it can't be determined. */
export function getJwtExpiryMs(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return null;
  return payload.exp * 1000;
}
