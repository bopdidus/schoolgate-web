import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { DashboardService as DashboardApiService, DashboardSummaryDto } from '../api';
import { DashboardOverview } from './dashboard.model';
import { fromCents, unwrapData } from '../core/utils/openapi-helpers';

/**
 * Role-scoped dashboard — `GET /dashboard/overview`.
 * Mapped from OpenAPI `DashboardSummaryDto`.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly dashboardApi = inject(DashboardApiService);

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
      recentPayments: (dto.recent_payments ?? []).map((row) => ({
        id: String(row.id ?? ''),
        studentName: String(row.student_name ?? ''),
        amount: fromCents(row.amount_cents),
        status: String(row.status ?? ''),
        declaredAt: String(row.declared_at ?? ''),
      })),
      enrollmentTrend: (dto.enrollment_trend ?? []).map((row) => ({
        date: String(row.date ?? ''),
        count: Number(row.count ?? 0),
      })),
      pendingPasswordResetRequests:
        dto.pending_password_reset_requests_count == null
          ? undefined
          : Number(dto.pending_password_reset_requests_count),
      pendingSchoolRegistrations:
        dto.pending_school_registrations_count == null
          ? undefined
          : Number(dto.pending_school_registrations_count),
    };
  }
}
