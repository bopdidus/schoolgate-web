import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  EnrollmentDto,
  EnrollmentsService,
  RejectEnrollmentRequestDto,
} from '../api';
import { PaginatedResponse } from '../shared/models/common.model';
import {
  pageToOffset,
  toPaginated,
  unwrapData,
  fromCents,
} from '../core/utils/openapi-helpers';
import {
  Enrollment,
  EnrollmentDocument,
  EnrollmentFilters,
  RejectEnrollmentRequest,
} from './enrollment.model';

@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  private readonly enrollmentsApi = inject(EnrollmentsService);

  getAll(filters: EnrollmentFilters): Observable<PaginatedResponse<Enrollment>> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;
    const { limit, offset } = pageToOffset(page, pageSize);
    return this.enrollmentsApi
      .enrollmentsGet(
        filters.schoolId ? +filters.schoolId : undefined,
        filters.paymentValidated,
        filters.matricule || undefined,
        filters.isReturningStudent,
        filters.academicYear || undefined,
        filters.classId ? +filters.classId : undefined,
        filters.tuitionSettled,
        limit,
        offset,
      )
      .pipe(
        map((envelope) => {
          const rows = unwrapData(envelope) ?? [];
          return toPaginated(
            rows.map((d) => this.mapEnrollment(d)),
            envelope.meta,
            page,
            pageSize,
          );
        }),
      );
  }

  /** Full enrollment detail including uploaded documents and review audit fields. */
  getById(id: string): Observable<Enrollment> {
    return this.enrollmentsApi.enrollmentsIdGet(+id).pipe(
      map((envelope) => this.mapEnrollment(unwrapData(envelope))),
    );
  }

  downloadDocument(enrollmentId: string, documentId: string): Observable<Blob> {
    return this.enrollmentsApi.enrollmentsIdDocumentsDocIdGet(+enrollmentId, +documentId);
  }

  accept(id: string): Observable<Enrollment> {
    return this.enrollmentsApi.enrollmentsIdAcceptPost(+id).pipe(
      map((envelope) => this.mapEnrollment(unwrapData(envelope))),
    );
  }

  reject(id: string, body: RejectEnrollmentRequest): Observable<Enrollment> {
    const request: RejectEnrollmentRequestDto = {
      rejection_reason: body.reason,
    };
    return this.enrollmentsApi.enrollmentsIdRejectPost(+id, request).pipe(
      map((envelope: { data?: EnrollmentDto; error?: { message?: string } | null }) =>
        this.mapEnrollment(unwrapData(envelope)),
      ),
    );
  }

  private mapEnrollment(dto: EnrollmentDto): Enrollment {
    const school = dto.school;
    const schoolClass = dto.school_class;
    const levelLabel = schoolClass?.level?.other_label || schoolClass?.level?.label || '';
    const specialtyLabel =
      schoolClass?.specialty?.other_label || schoolClass?.specialty?.label;
    const systemRaw = schoolClass?.effective_system ?? schoolClass?.pedagogic_system;
    const educationTypeRaw = schoolClass?.education_type;

    const personName = [dto.person?.first_name, dto.person?.last_name]
      .filter((part) => part != null && String(part).trim() !== '')
      .join(' ')
      .trim();

    return {
      id: String(dto.id ?? ''),
      studentName: personName,
      studentGender: dto.person?.gender,
      schoolId: String(school?.id ?? schoolClass?.school_id ?? ''),
      schoolName: String(school?.name ?? ''),
      classId: String(dto.school_class_id ?? schoolClass?.id ?? ''),
      className: [levelLabel, specialtyLabel].filter(Boolean).join(' — ') || levelLabel,
      classSystem:
        systemRaw === 'anglophone' || systemRaw === 'francophone'
          ? systemRaw
          : 'francophone',
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
      classLevelId: schoolClass?.level?.id != null ? String(schoolClass.level.id) : undefined,
      classLevelLabel: levelLabel || undefined,
      balance: dto.balance
        ? {
            tuitionTotal: fromCents(dto.balance.tuition_total_cents),
            tuitionPaid: fromCents(dto.balance.tuition_paid_cents),
            tuitionPending: fromCents(dto.balance.tuition_pending_cents),
            tuitionRemaining: fromCents(dto.balance.tuition_remaining_cents),
            tuitionSettled: Boolean(dto.balance.tuition_settled),
            enrollmentFee: fromCents(dto.balance.enrollment_fee_cents),
            enrollmentFeePaid: fromCents(dto.balance.enrollment_fee_paid_cents),
            enrollmentFeeStatus: dto.balance.enrollment_fee_status ?? 'unpaid',
          }
        : undefined,
      tuitionInstallments: (schoolClass?.installments ?? []).map((inst) => ({
        number: inst.number ?? 0,
        amount: fromCents(inst.amount_cents),
        dueDate: String(inst.due_date ?? ''),
      })),
      academicYear: dto.academic_year || school?.academic_year || undefined,
      status: (dto.status as Enrollment['status']) ?? 'pending',
      isExistingStudent: Boolean(dto.is_returning_student),
      documentsReceived: !Boolean(dto.requires_documents),
      paymentValidated: Boolean(dto.payment_validated),
      rejectionReason: dto.rejection_reason ?? undefined,
      documents: (dto.documents ?? []).map((d) => this.mapDocument(d)),
      reviewedByUserId: dto.reviewed_by_user_id ?? undefined,
      reviewedAt: dto.reviewed_at ?? undefined,
      createdAt: String(dto.created_at ?? ''),
      updatedAt: String(dto.created_at ?? ''),
    };
  }

  private mapDocument(dto: {
    id?: number;
    filename?: string;
    content_type?: string;
    size_bytes?: number;
    created_at?: string;
  }): EnrollmentDocument {
    return {
      id: String(dto.id ?? ''),
      filename: String(dto.filename ?? ''),
      contentType: dto.content_type ?? undefined,
      sizeBytes: dto.size_bytes ?? undefined,
      createdAt: dto.created_at ?? undefined,
    };
  }
}
