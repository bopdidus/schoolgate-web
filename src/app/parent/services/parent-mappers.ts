import {
  DocumentChecklistItemDto,
  DocumentRequirementDto,
  EnrollmentBalanceDto,
  EnrollmentDto,
  InstallmentDto,
  PaymentDto,
  PersonDto,
  SchoolClassDto,
  SchoolDto,
} from '../../api';
import {
  ChecklistItem,
  Child,
  ClassOffering,
  DocumentRequirement,
  EnrollmentBalance,
  EnrollmentStatus,
  ParentEnrollment,
  ParentPayment,
  ParentPaymentStatus,
  ParentSchool,
} from '../domain/models';

/** API → parent-space models. Amounts stay in cents. */

const str = (v: unknown): string => (v === undefined || v === null ? '' : String(v));

export function mapOffering(dto: SchoolClassDto): ClassOffering {
  const level = dto.level?.other_label || dto.level?.label || '';
  const specialty = dto.specialty?.other_label || dto.specialty?.label || '';
  return {
    id: str(dto.id),
    schoolId: str(dto.school_id),
    label: [level, specialty].filter(Boolean).join(' — ') || level,
    educationType: dto.education_type ?? 'general',
    system: dto.effective_system ?? dto.pedagogic_system,
    enrollmentFeeCents: dto.enrollment_fee_cents ?? 0,
    enrollmentFeeDueDate: dto.enrollment_fee_due_date ?? undefined,
    advanceAllowed: dto.advance_allowed ?? false,
    advancePercentage: dto.advance_percentage ?? 0,
    installments: (dto.installments ?? []).map(mapInstallment).sort((a, b) => a.number - b.number),
    totalSeats: dto.total_seats ?? 0,
    seatsRemaining: dto.seats_remaining ?? 0,
  };
}

function mapInstallment(dto: InstallmentDto) {
  return {
    number: dto.number ?? 0,
    amountCents: dto.amount_cents ?? 0,
    dueDate: str(dto.due_date),
    advanceAllowed: dto.advance_allowed ?? false,
    advancePercentage: dto.advance_percentage ?? 0,
  };
}

export function mapSchool(dto: SchoolDto): ParentSchool {
  return {
    id: str(dto.id),
    name: str(dto.name),
    city: dto.city?.name ?? '',
    address: str(dto.address),
    phone: str(dto.phone),
    email: str(dto.email),
    system: str(dto.system),
    academicYear: str(dto.academic_year),
    enrollmentDeadline: dto.enrollment_deadline ?? null,
    reviewDeadlineDays: dto.review_deadline_days,
    paymentDeadlineDays: dto.payment_deadline_days,
    allowsDirectPayment: dto.allow_direct_payment_for_returning_students ?? false,
    classes: (dto.school_classes ?? []).map(mapOffering),
  };
}

export function mapRequirement(dto: DocumentRequirementDto): DocumentRequirement {
  return {
    documentType: { id: str(dto.document_type?.id), code: str(dto.document_type?.code), label: str(dto.document_type?.label) },
    purpose: dto.purpose === 'tuition_payment' ? 'tuition_payment' : 'enrollment',
    required: dto.required ?? true,
    otherLabel: dto.other_label,
  };
}

export function mapChecklistItem(dto: DocumentChecklistItemDto): ChecklistItem {
  return {
    documentType: { id: str(dto.document_type?.id), code: str(dto.document_type?.code), label: str(dto.document_type?.label) },
    purpose: dto.purpose === 'tuition_payment' ? 'tuition_payment' : 'enrollment',
    required: dto.required ?? true,
    satisfied: dto.satisfied ?? false,
  };
}

export function mapChild(dto: PersonDto): Child {
  return {
    id: str(dto.id),
    firstName: str(dto.first_name),
    lastName: str(dto.last_name),
    gender: dto.gender,
    birthDate: dto.birth_date,
    matricule: dto.matricule ?? undefined,
  };
}

function mapBalance(dto: EnrollmentBalanceDto): EnrollmentBalance {
  return {
    tuitionTotalCents: dto.tuition_total_cents ?? 0,
    tuitionPaidCents: dto.tuition_paid_cents ?? 0,
    tuitionPendingCents: dto.tuition_pending_cents ?? 0,
    tuitionRemainingCents: dto.tuition_remaining_cents ?? 0,
    tuitionSettled: dto.tuition_settled ?? false,
    enrollmentFeeCents: dto.enrollment_fee_cents ?? 0,
    enrollmentFeePaidCents: dto.enrollment_fee_paid_cents ?? 0,
    enrollmentFeeStatus: dto.enrollment_fee_status ?? 'unpaid',
  };
}

function enrollmentStatus(raw: string | undefined): EnrollmentStatus {
  return raw === 'active' || raw === 'cancelled' ? raw : 'pending';
}

export function mapEnrollment(dto: EnrollmentDto): ParentEnrollment {
  return {
    id: str(dto.id),
    status: enrollmentStatus(dto.status),
    academicYear: str(dto.academic_year),
    isReturningStudent: dto.is_returning_student ?? false,
    requiresDocuments: dto.requires_documents ?? false,
    paymentValidated: dto.payment_validated ?? false,
    rejectionReason: dto.rejection_reason,
    rejectionReasonCode: dto.rejection_reason_code ?? undefined,
    reviewDueAt: dto.review_due_at ?? undefined,
    paymentDueAt: dto.payment_due_at ?? undefined,
    createdAt: str(dto.created_at),
    matriculeVerificationStatus: dto.matricule_verification_status ?? undefined,
    child: dto.person ? mapChild(dto.person) : undefined,
    schoolId: str(dto.school?.id ?? dto.school_class?.school_id),
    schoolName: str(dto.school?.name),
    offering: dto.school_class?.id ? mapOffering(dto.school_class) : undefined,
    balance: dto.balance ? mapBalance(dto.balance) : undefined,
  };
}

const PAYMENT_STATUSES: ParentPaymentStatus[] = ['declared', 'validated', 'rejected', 'refund_pending', 'refunded'];

export function mapPayment(dto: PaymentDto): ParentPayment {
  const status = PAYMENT_STATUSES.includes(dto.status as ParentPaymentStatus)
    ? (dto.status as ParentPaymentStatus)
    : 'declared';
  return {
    id: str(dto.id),
    enrollmentId: str(dto.enrollment_id),
    type: dto.type === 'tuition_installment' ? 'tuition_installment' : 'enrollment_fee',
    installmentNumber: dto.installment_number ?? undefined,
    amountCents: dto.amount_cents ?? 0,
    feeCents: dto.fee_cents ?? 0,
    status,
    method: dto.payment_method,
    payerMsisdn: dto.payer_msisdn,
    externalReference: dto.external_reference || dto.mobile_money_reference,
    declaredAt: dto.declared_at,
    validatedAt: dto.validated_at,
  };
}

/** `POST /payments` and sync-status answer `{ payment, ... }` in the envelope. */
export function unwrapPayment(body: unknown): ParentPayment {
  const data = (body as { data?: unknown })?.data ?? body;
  const payment = (data as { payment?: PaymentDto })?.payment ?? (data as PaymentDto);
  if (!payment || typeof payment !== 'object') throw new Error('Unexpected payment response');
  return mapPayment(payment);
}
