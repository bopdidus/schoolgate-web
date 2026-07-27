import {
  DEFAULT_PAYMENT_VALIDATION_DAYS,
  MAX_PAYMENT_VALIDATION_DAYS,
  MIN_PAYMENT_VALIDATION_DAYS,
} from '../../../shared/constants/payment.constants';
import { ClassFee } from '../domain/models/school.model';

export function validatePaymentValidationDays(days: number): string | null {
  if (days < MIN_PAYMENT_VALIDATION_DAYS || days > MAX_PAYMENT_VALIDATION_DAYS) {
    return 'SCHOOLS.PAYMENT_VALIDATION_DAYS_RANGE';
  }
  return null;
}

export function validateFeesChronological(fees: ClassFee[]): string | null {
  const dates = fees
    .map((f) => f.dueDate)
    .filter(Boolean)
    .map((d) => new Date(d).getTime())
    .filter((t) => !Number.isNaN(t));

  for (let i = 1; i < dates.length; i++) {
    if (dates[i] <= dates[i - 1]) {
      return 'SCHOOLS.DEADLINES_ORDER';
    }
  }
  return null;
}

/**
 * Backend expects installment due dates as UTC midnight ISO-8601, e.g. `2026-11-02T00:00:00Z`.
 * Uses the calendar day the user picked (local y/m/d) so timezone offsets don't shift the date.
 */
export function toUtcMidnightIso(value: string | Date | null | undefined): string {
  if (value == null || value === '') return '';

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}T00:00:00Z`;
  }

  const raw = String(value).trim();
  const datePart = raw.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return `${datePart}T00:00:00Z`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';
  return toUtcMidnightIso(parsed);
}

export { DEFAULT_PAYMENT_VALIDATION_DAYS, MAX_PAYMENT_VALIDATION_DAYS, MIN_PAYMENT_VALIDATION_DAYS };
