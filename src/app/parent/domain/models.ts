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
