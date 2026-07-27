import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { PaymentsService, PaymentDto, SchoolsService } from '../../../api';
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
  private readonly schoolsApi = inject(SchoolsService);

  getAll(filters: PaymentFilters): Observable<PaginatedResponse<Payment>> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;
    const { limit, offset } = pageToOffset(page, pageSize);

    const loadForSchool = (schoolId: number, schoolName = '') => {
      const status =
        filters.status === 'declared' ||
        filters.status === 'validated' ||
        filters.status === 'rejected'
          ? filters.status
          : undefined;
      return this.paymentsApi
        .schoolsIdPaymentsGet(schoolId, status, undefined, undefined, limit, offset)
        .pipe(
          map((envelope) => {
            const rows = unwrapData(envelope) ?? [];
            return toPaginated(
              rows.map((dto) => this.mapPayment(dto, String(schoolId), schoolName)),
              envelope.meta,
              page,
              pageSize,
            );
          }),
        );
    };

    if (filters.schoolId) {
      return loadForSchool(+filters.schoolId);
    }

    // School staff: resolve school via /schools/mine
    return this.schoolsApi.schoolsMineGet().pipe(
      switchMap((envelope) => {
        const school = unwrapData(envelope);
        if (!school.id) {
          return of(toPaginated<Payment>([], undefined, page, pageSize));
        }
        return loadForSchool(school.id, school.name ?? '');
      }),
    );
  }

  /** Not exposed by the OpenAPI contract — kept for admin UI compatibility. */
  getCommissionSummary(): Observable<SchoolCommissionSummary[]> {
    return of([]);
  }

  validate(data: ValidatePaymentRequest): Observable<void> {
    const ids = data.payment_ids.map((id) => +id);
    if (!ids.length) return of(undefined);
    return forkJoin(
      ids.map((id) => this.paymentsApi.paymentsIdValidatePost(id)),
    ).pipe(map(() => undefined));
  }

  reject(data: RejectPaymentRequest): Observable<void> {
    const ids = data.payment_ids.map((id) => +id);
    if (!ids.length) return of(undefined);
    return forkJoin(
      ids.map((id) => this.paymentsApi.paymentsIdRejectPost(id)),
    ).pipe(map(() => undefined));
  }

  private mapPayment(dto: PaymentDto, schoolId: string, schoolName: string): Payment {
    return {
      id: String(dto.id ?? ''),
      enrollmentId: String(dto.enrollment_id ?? ''),
      type: (dto.type as Payment['type']) ?? 'enrollment_fee',
      installmentNumber: dto.installment_number ?? undefined,
      amount: fromCents(dto.amount_cents),
      declaredAt: String(dto.declared_at ?? ''),
      deadline: String(dto.validation_deadline ?? ''),
      status: (dto.status as Payment['status']) ?? 'declared',
      schoolId,
      schoolName,
      studentName: '',
      classEducationType: 'general',
      validatedAt: dto.validated_at ?? undefined,
    };
  }
}
