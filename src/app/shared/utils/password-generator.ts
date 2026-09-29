// Look-alike characters (0/O, 1/l/I) are left out: the admin reads the
// password out or types it into a message for the user.
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%*-_=+?';
const ALL = LOWER + UPPER + DIGITS + SYMBOLS;

export const GENERATED_PASSWORD_LENGTH = 14;

/**
 * A random password with at least one lowercase letter, uppercase letter,
 * digit and symbol, drawn from the browser's CSPRNG (never Math.random).
 */
export function generatePassword(length = GENERATED_PASSWORD_LENGTH): string {
  const required = [LOWER, UPPER, DIGITS, SYMBOLS];
  if (length < required.length) {
    throw new Error(`A password needs at least ${required.length} characters`);
  }
  const chars = required.map(pick);
  while (chars.length < length) {
    chars.push(pick(ALL));
  }
  // Fisher–Yates, so the guaranteed classes are not always at the start.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

function pick(alphabet: string): string {
  return alphabet[randomIndex(alphabet.length)];
}

/** Uniform integer in [0, max) — rejection sampling avoids modulo bias. */
function randomIndex(max: number): number {
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % max;
}
