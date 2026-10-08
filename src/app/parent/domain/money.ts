/**
 * Money rules shared with the API and the mobile app. Amounts are XAF cents;
 * operators charge whole francs only, and the API refuses an amount with
 * centimes.
 */
export const CENTS_PER_FRANC = 100;

/**
 * Smallest advance the API accepts on a fee line of `totalCents`: `percentage`
 * % rounded up to a whole franc, at least one franc and at most the line.
 *
 * Mirrors `minAdvanceCents` in SchoolGateApi
 * (internal/services/payment/amount_validator.go) and `Money.minAdvanceCents`
 * in the mobile app; keep the three in sync.
 */
export function minAdvanceCents(totalCents: number, percentage: number): number {
  if (percentage <= 0) return totalCents;
  const francs = Math.ceil((totalCents * percentage) / 100 / CENTS_PER_FRANC);
  const min = francs * CENTS_PER_FRANC;
  if (min < CENTS_PER_FRANC) return CENTS_PER_FRANC;
  return min > totalCents ? totalCents : min;
}

/**
 * Platform service fee on one payment of `amountCents` owed to the school,
 * rounded up to a whole franc.
 *
 * Mirrors `FeePolicy.FeeFor` in SchoolGateApi (internal/models/payment/fee.go)
 * and `FeePolicy.feeFor` in the mobile app; keep the three in sync.
 */
export function serviceFeeCents(percent: number, amountCents: number): number {
  if (percent <= 0 || amountCents <= 0) return 0;
  // Basis points keep the arithmetic in integers: 2.5% -> 250.
  const bps = Math.round(percent * 100);
  const raw = Math.floor((amountCents * bps + 9_999) / 10_000); // ceil(amount * bps / 10000)
  return Math.floor((raw + 99) / 100) * 100; // up to the next whole franc
}

/** Cents to francs, for display (amounts are whole francs). */
export function toFrancs(cents: number): number {
  return cents / CENTS_PER_FRANC;
}
