import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ArrearsReportDto, FinanceService as FinanceApiService, FinanceSummaryDto } from '../api';
import { fromCents, pageToOffset, toId, unwrapData } from '../core/utils/openapi-helpers';
import {
  ArrearsFilters,
  ArrearsReport,
  EnrolledExportFilters,
  FinancePeriod,
  FinanceSummary,
} from './finance.model';

/** School money reports — `/schools/{id}/finance/*` and the Excel exports. */
@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly api = inject(FinanceApiService);

  getSummary(schoolId: string, period: FinancePeriod): Observable<FinanceSummary> {
    return this.api
      .schoolsIdFinanceSummaryGet(+schoolId, period)
      .pipe(map((envelope) => this.mapSummary(unwrapData(envelope))));
  }

  exportSummary(schoolId: string, period: FinancePeriod): Observable<Blob> {
    return this.api.schoolsIdFinanceSummaryExportGet(+schoolId, period);
  }

  getArrears(schoolId: string, filters: ArrearsFilters = {}): Observable<ArrearsReport> {
    const { limit, offset } = pageToOffset(filters.page ?? 1, filters.pageSize ?? 20);
    return this.api
      .schoolsIdFinanceArrearsGet(+schoolId, toId(filters.schoolClassId), filters.academicYear, filters.asOf, limit, offset)
      .pipe(map((envelope) => this.mapArrears(unwrapData(envelope))));
  }

  /** Every row matching the filters, not just the page on screen. */
  exportArrears(schoolId: string, filters: ArrearsFilters = {}): Observable<Blob> {
    return this.api.schoolsIdFinanceArrearsExportGet(+schoolId, toId(filters.schoolClassId), filters.academicYear, filters.asOf);
  }

  exportEnrolled(schoolId: string, filters: EnrolledExportFilters = {}): Observable<Blob> {
    return this.api.schoolsIdEnrollmentsExportGet(
      +schoolId,
      toId(filters.schoolClassId),
      filters.academicYear,
      filters.tuitionSettled,
    );
  }

  private mapSummary(d: FinanceSummaryDto): FinanceSummary {
    return {
      period: (d.period ?? 'day') as FinancePeriod,
      installmentNumbers: d.installment_numbers ?? [],
      series: (d.series ?? []).map((b) => ({
        start: b.start ?? '',
        total: fromCents(b.total_cents),
        lines: (b.lines ?? []).map((l) => ({
          installment: l.installment_number ?? null,
          amount: fromCents(l.amount_cents),
        })),
      })),
      total: fromCents(d.total_cents),
      today: fromCents(d.today_cents),
      week: fromCents(d.week_cents),
      month: fromCents(d.month_cents),
      pending: fromCents(d.pending_cents),
    };
  }

  private mapArrears(d: ArrearsReportDto): ArrearsReport {
    return {
      academicYear: d.academic_year ?? '',
      asOf: d.as_of ?? '',
      count: d.count ?? 0,
      totalOutstanding: fromCents(d.total_outstanding_cents),
      rows: (d.rows ?? []).map((r) => ({
        enrollmentId: String(r.enrollment_id ?? ''),
        studentName: r.student_name ?? '',
        matricule: r.matricule ?? '',
        schoolClassName: r.school_class_name ?? '',
        parentName: r.parent_name ?? '',
        parentPhone: r.parent_phone ?? '',
        parentEmail: r.parent_email ?? '',
        due: fromCents(r.due_cents),
        paid: fromCents(r.paid_cents),
        outstanding: fromCents(r.outstanding_cents),
        currentInstallment: r.current_installment ?? null,
        daysLate: r.days_late ?? 0,
      })),
    };
  }
}
