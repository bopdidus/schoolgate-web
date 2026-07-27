import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { DashboardService, DashboardSummaryDto } from '../../../api';
import { DashboardOverview } from '../domain/models/dashboard.model';
import { unwrapData } from '../../../core/api/openapi-helpers';

/**
 * Role-scoped dashboard — `GET /dashboard/overview`.
 * Mapped from OpenAPI `DashboardSummaryDto`.
 */
@Injectable({ providedIn: 'root' })
export class DashboardRepository {
  private readonly dashboardApi = inject(DashboardService);

  getOverview(): Observable<DashboardOverview> {
    return this.dashboardApi.dashboardOverviewGet().pipe(
      map((envelope) => this.mapOverview(unwrapData(envelope))),
    );
  }

  private mapOverview(dto: DashboardSummaryDto): DashboardOverview {
    return {
      role: (dto.role as DashboardOverview['role']) ?? 'school_admin',
      stats: {
        pendingValidations: Number(dto.pending_payments_count ?? 0),
        validatedPayments: Number(dto.validated_payments_count ?? 0),
        seatsFilledPercent: Number(dto.aggregate_filled_percent ?? 0),
      },
      classPaymentStats: (dto.school_classes ?? []).map((row) => ({
        className: String(row.school_class_name ?? ''),
        validated: Number(row.validated_count ?? 0),
        pending: 0,
      })),
    };
  }
}
