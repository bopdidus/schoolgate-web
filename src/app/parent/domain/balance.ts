import { buildTuitionSummary, TuitionSummary } from '../../enrollments/tuition-summary';
import { ClassOffering, ParentPayment } from './models';

/**
 * A student's tuition (every installment, enrollment fee excluded): paid =
 * validated, pending apart, remaining. Amounts in cents. Reuses the back
 * office's `buildTuitionSummary`, unit-agnostic.
 */
export function tuitionSummaryFor(offering: ClassOffering, payments: ParentPayment[]): TuitionSummary {
  return buildTuitionSummary(
    offering.installments.map((i) => ({ number: i.number, amount: i.amountCents, dueDate: i.dueDate })),
    payments.map((p) => ({ type: p.type, installmentNumber: p.installmentNumber, status: p.status, amount: p.amountCents })),
  );
}

/** Where the enrollment fee stands, with the same rules as the tuition. */
export interface EnrollmentFeeProgress {
  totalCents: number;
  paidCents: number;
  pendingCents: number;
  remainingCents: number;
  settled: boolean;
}

export function enrollmentFeeProgress(offering: ClassOffering, payments: ParentPayment[]): EnrollmentFeeProgress {
  const fee = payments.filter((p) => p.type === 'enrollment_fee');
  const sum = (status: ParentPayment['status']) =>
    fee.filter((p) => p.status === status).reduce((total, p) => total + p.amountCents, 0);
  const paidCents = sum('validated');
  const remainingCents = Math.max(offering.enrollmentFeeCents - paidCents, 0);
  return {
    totalCents: offering.enrollmentFeeCents,
    paidCents,
    pendingCents: sum('declared'),
    remainingCents,
    settled: remainingCents === 0,
  };
}
