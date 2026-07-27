import { MetaDto } from '../../api';
import { PaginatedResponse } from '../../shared/models/common.model';

/** Unwrap `{ data, error }` envelopes returned by the OpenAPI client. */
export function unwrapData<T>(envelope: { data?: T; error?: { message?: string } | null }): T {
  if (envelope.error != null) {
    throw new Error(envelope.error.message ?? 'API error');
  }
  if (envelope.data === undefined) {
    throw new Error('API response missing data');
  }
  return envelope.data;
}

export function unwrapDataOrNull<T>(
  envelope: { data?: T; error?: { message?: string } | null },
): T | null {
  if (envelope.error != null) {
    throw new Error(envelope.error.message ?? 'API error');
  }
  return envelope.data ?? null;
}

export function pageToOffset(page = 1, pageSize = 10): { limit: number; offset: number } {
  const safePage = Math.max(1, page);
  const limit = Math.max(1, pageSize);
  return { limit, offset: (safePage - 1) * limit };
}

export function toPaginated<T>(
  data: T[],
  meta: MetaDto | undefined,
  page: number,
  pageSize: number,
): PaginatedResponse<T> {
  return {
    data,
    total: meta?.total ?? data.length,
    page: meta?.limit ? Math.floor((meta.offset ?? 0) / meta.limit) + 1 : page,
    page_size: meta?.limit ?? pageSize,
  };
}

/** Convert API cents → display major units. */
export function fromCents(cents?: number | null): number {
  return (cents ?? 0) / 100;
}

/** Convert display major units → API cents. */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}
