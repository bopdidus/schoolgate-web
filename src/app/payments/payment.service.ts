import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { PaymentsService, PaymentDto } from '../api';
import { PaginatedResponse } from '../shared/models/common.model';
import {
  fromCents,
  pageToOffset,
  toPaginated,
  unwrapData,
} from '../core/utils/openapi-helpers';
import { Payment, PaymentFilters } from './payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
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
        filters.enrollmentId ? +filters.enrollmentId : undefined,
        undefined,
        filters.manual,
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

  /**
   * The school found this manual payment on its own account: validates it,
   * reserves the seat and issues the invoice. Operator payments settle alone.
   */
  confirm(paymentId: string): Observable<void> {
    return this.paymentsApi.paymentsIdConfirmPost(+paymentId).pipe(map(() => undefined));
  }

  /** No matching transfer reached the school: the parent sees the reason and may declare again. */
  reject(paymentId: string, reason: string): Observable<void> {
    return this.paymentsApi.paymentsIdRejectPost(+paymentId, { reason }).pipe(map(() => undefined));
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
      method: (dto.payment_method as Payment['method']) ?? 'mtn',
      manual: dto.manual ?? false,
      mobileMoneyReference: dto.mobile_money_reference ?? '',
    };
  }
}
