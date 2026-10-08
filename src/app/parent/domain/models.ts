/**
 * Parent-space models. Amounts are kept in XAF cents, exactly as the API sends
 * them, so the payment rules below compute on the same integers as the API;
 * convert to francs (`/ 100`) only for display.
 */

export type ParentPaymentType = 'enrollment_fee' | 'tuition_installment';

export type ParentPaymentStatus = 'declared' | 'validated' | 'rejected' | 'refund_pending' | 'refunded';

export type MobileMoneyMethod = 'mtn' | 'orange';

export type Gender = 'male' | 'female';

export interface ParentPayment {
  id: string;
  enrollmentId: string;
  type: ParentPaymentType;
  installmentNumber?: number;
  /** Owed to the school. */
  amountCents: number;
  /** Platform service fee the parent paid on top. */
  feeCents: number;
  status: ParentPaymentStatus;
  method?: string;
  payerMsisdn?: string;
  externalReference?: string;
  declaredAt?: string;
  validatedAt?: string;
}

export interface ClassInstallment {
  number: number;
  amountCents: number;
  dueDate: string;
  advanceAllowed: boolean;
  advancePercentage: number;
}

/** A class a parent can enroll a child in (`SchoolClass` in the API). */
export interface ClassOffering {
  id: string;
  schoolId: string;
  label: string;
  educationType: string;
  system?: string;
  enrollmentFeeCents: number;
  enrollmentFeeDueDate?: string;
  /** Class-level advance: applies to the enrollment fee only, as in the API. */
  advanceAllowed: boolean;
  advancePercentage: number;
  installments: ClassInstallment[];
  totalSeats: number;
  seatsRemaining: number;
}

/** One payment request line (`POST /payments`). */
export interface PaymentLineItem {
  type: ParentPaymentType;
  amountCents: number;
  installmentNumber?: number;
}

export interface LabelRef {
  id: string;
  code: string;
  label: string;
}

/** A school as a parent browses it, with its classes. */
export interface ParentSchool {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  system: string;
  academicYear: string;
  /** ISO date after which requests are refused; null = always open. */
  enrollmentDeadline: string | null;
  reviewDeadlineDays?: number;
  paymentDeadlineDays?: number;
  /** Returning students may skip the review with their matricule. */
  allowsDirectPayment: boolean;
  classes: ClassOffering[];
}

/** A document a school requires, by purpose. */
export interface DocumentRequirement {
  documentType: LabelRef;
  purpose: 'enrollment' | 'tuition_payment';
  required: boolean;
  otherLabel?: string;
}

export interface ChecklistItem {
  documentType: LabelRef;
  purpose: 'enrollment' | 'tuition_payment';
  required: boolean;
  satisfied: boolean;
}

/** A child saved on the parent's account (`/persons`). */
export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  gender?: Gender;
  birthDate?: string;
  matricule?: string;
}

/** Status of the enrollment fee on listings (API `balance`). */
export type EnrollmentFeeStatus = 'paid' | 'partial' | 'pending' | 'unpaid';

export interface EnrollmentBalance {
  tuitionTotalCents: number;
  tuitionPaidCents: number;
  tuitionPendingCents: number;
  tuitionRemainingCents: number;
  tuitionSettled: boolean;
  enrollmentFeeCents: number;
  enrollmentFeePaidCents: number;
  enrollmentFeeStatus: EnrollmentFeeStatus;
}

/** API enrollment status: `pending` (awaiting review), `active` (accepted), `cancelled`. */
export type EnrollmentStatus = 'pending' | 'active' | 'cancelled';

export interface ParentEnrollment {
  id: string;
  status: EnrollmentStatus;
  academicYear: string;
  isReturningStudent: boolean;
  requiresDocuments: boolean;
  paymentValidated: boolean;
  rejectionReason?: string;
  rejectionReasonCode?: string;
  reviewDueAt?: string;
  paymentDueAt?: string;
  createdAt: string;
  matriculeVerificationStatus?: string;
  child?: Child;
  schoolId: string;
  schoolName: string;
  offering?: ClassOffering;
  balance?: EnrollmentBalance;
}
