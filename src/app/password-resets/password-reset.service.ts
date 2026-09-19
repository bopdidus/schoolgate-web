import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { AuthService as OpenApiAuthService, PasswordResetRequestRecordDto } from '../api';
import { PaginatedResponse, UserRole } from '../shared/models/common.model';
import { pageToOffset, toPaginated, unwrapData } from '../core/utils/openapi-helpers';
import {
  PasswordResetFilters,
  PasswordResetRequest,
  PasswordResetStats,
} from './password-reset.model';

@Injectable({ providedIn: 'root' })
export class PasswordResetService {
  private readonly authApi = inject(OpenApiAuthService);

  /** Reset requests, newest first. */
  getAll(filters: PasswordResetFilters = {}): Observable<PaginatedResponse<PasswordResetRequest>> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;
    const { limit, offset } = pageToOffset(page, pageSize);
    return this.authApi
      .authPasswordResetRequestsGet(filters.status, toId(filters.userId), limit, offset)
      .pipe(
        map((envelope) =>
          toPaginated(
            (unwrapData(envelope) ?? []).map((dto) => this.mapRequest(dto)),
            envelope.meta,
            page,
            pageSize,
          ),
        ),
      );
  }

  /** How many times a user asked, how many still wait, and when they last asked. */
  getStatsForUser(userId: string): Observable<PasswordResetStats> {
    return forkJoin({
      all: this.getAll({ userId, pageSize: 1 }),
      pending: this.getAll({ userId, status: 'pending', pageSize: 1 }),
    }).pipe(
      map(({ all, pending }) => ({
        total: all.total,
        pending: pending.total,
        lastRequestedAt: all.data[0]?.requestedAt ?? null,
      })),
    );
  }

  private mapRequest(dto: PasswordResetRequestRecordDto): PasswordResetRequest {
    const name = [dto.user?.first_name, dto.user?.last_name]
      .filter((part) => part != null && String(part).trim() !== '')
      .join(' ');
    return {
      id: String(dto.id ?? ''),
      userId: String(dto.user_id ?? ''),
      name,
      email: String(dto.user?.email ?? ''),
      role: (dto.user?.role as UserRole | undefined) ?? null,
      status: dto.status === 'resolved' ? 'resolved' : 'pending',
      requestedAt: String(dto.requested_at ?? ''),
      resolvedAt: dto.resolved_at ?? null,
    };
  }
}

function toId(id: string | undefined): number | undefined {
  const n = Number(id);
  return id && Number.isFinite(n) ? n : undefined;
}
