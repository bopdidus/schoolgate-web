import { Injectable, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { PaymentsService, PaymentDto } from '../../../api';
import { PaginatedResponse } from '../../../shared/models/common.model';
import {
  fromCents,
  pageToOffset,
  toPaginated,
  unwrapData,
} from '../../../core/api/openapi-helpers';
import {
  Payment,
  PaymentFilters,
  RejectPaymentRequest,
  SchoolCommissionSummary,
  ValidatePaymentRequest,
} from '../domain/models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentRepository {
  private readonly paymentsApi = inject(PaymentsService);

  getAll(filters: PaymentFilters): Observable<PaginatedResponse<Payment>> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;
    const { limit, offset } = pageToOffset(page, pageSize);
    const status =
      filters.status === 'declared' ||
      filters.status === 'validated' ||
      filters.status === 'rejected'
        ? filters.status
        : undefined;

    return this.paymentsApi
      .paymentsGet(
        filters.schoolId ? +filters.schoolId : undefined,
        status,
        undefined,
        undefined,
        limit,
        offset,
      )
      .pipe(
        map((envelope) => {
          let rows = (unwrapData(envelope) ?? []).map((dto) => this.mapPayment(dto));
          const educationType = filters.educationType as string | undefined;
          if (educationType) {
            const normalized =
              educationType === 'professional' ? 'vocational' : educationType;
            rows = rows.filter((p) => p.classEducationType === normalized);
          }
          const specialty = filters.specialtyId?.trim().toLowerCase();
          if (specialty) {
            rows = rows.filter((p) =>
              (p.classSpecialtyLabel ?? '').toLowerCase().includes(specialty),
            );
          }
          return toPaginated(
            rows,
            educationType || specialty ? { total: rows.length, limit, offset } : envelope.meta,
            page,
            pageSize,
          );
        }),
      );
  }

  /** Not exposed by the OpenAPI contract — kept for admin UI compatibility. */
  getCommissionSummary(): Observable<SchoolCommissionSummary[]> {
    return this.getAll({ status: 'validated', page: 1, pageSize: 100 }).pipe(
      map((page) => {
        const bySchool = new Map<string, SchoolCommissionSummary>();
        for (const payment of page.data) {
          const key = payment.schoolId || 'unknown';
          const existing = bySchool.get(key) ?? {
            schoolId: key,
            schoolName: payment.schoolName || key,
            city: '',
            commissionCount: 0,
            totalCommissionAmount: 0,
          };
          existing.commissionCount += 1;
          existing.totalCommissionAmount += payment.amount * 0.05;
          bySchool.set(key, existing);
        }
        return [...bySchool.values()];
      }),
    );
  }

  /** Manual validate/reject were removed; payments now sync via Mobile Money providers. */
  validate(_data: ValidatePaymentRequest): Observable<void> {
    return throwError(() => new Error('Payment validation is no longer available via this API'));
  }

  /** Manual validate/reject were removed; payments now sync via Mobile Money providers. */
  reject(_data: RejectPaymentRequest): Observable<void> {
    return throwError(() => new Error('Payment rejection is no longer available via this API'));
  }

  private mapPayment(dto: PaymentDto): Payment {
    const personName = [dto.person?.first_name, dto.person?.last_name]
      .filter((part) => part != null && String(part).trim() !== '')
      .join(' ')
      .trim();
    const schoolClass = dto.school_class;
    const educationTypeRaw = schoolClass?.education_type;
    const specialtyLabel =
      schoolClass?.specialty?.other_label || schoolClass?.specialty?.label;

    return {
      id: String(dto.id ?? ''),
      enrollmentId: String(dto.enrollment_id ?? ''),
      type: (dto.type as Payment['type']) ?? 'enrollment_fee',
      installmentNumber: dto.installment_number ?? undefined,
      amount: fromCents(dto.amount_cents),
      declaredAt: String(dto.declared_at ?? ''),
      deadline: String(dto.validation_deadline ?? ''),
      status: (dto.status as Payment['status']) ?? 'declared',
      schoolId: String(dto.school?.id ?? schoolClass?.school_id ?? ''),
      schoolName: String(dto.school?.name ?? ''),
      studentName: personName,
      classEducationType:
        educationTypeRaw === 'technical' ||
        educationTypeRaw === 'vocational' ||
        educationTypeRaw === 'general'
          ? educationTypeRaw
          : educationTypeRaw === 'professional'
            ? 'vocational'
            : 'general',
      classSpecialtyId:
        schoolClass?.specialty?.id != null ? String(schoolClass.specialty.id) : undefined,
      classSpecialtyLabel: specialtyLabel || undefined,
      validatedAt: dto.validated_at ?? undefined,
      rejectionReason: dto.rejection_reason ?? undefined,
      payerMsisdn: dto.payer_msisdn ?? undefined,
      externalReference: dto.external_reference ?? undefined,
    };
  }
}
