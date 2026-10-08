import { Payment } from '../payments/payment.model';
import { buildTuitionSummary } from './tuition-summary';

function payment(partial: Partial<Payment>): Payment {
  return {
    id: 'p',
    enrollmentId: 'e',
    type: 'tuition_installment',
    amount: 0,
    declaredAt: '',
    deadline: '',
    status: 'validated',
    schoolId: '1',
    schoolName: '',
    studentName: '',
    classEducationType: 'general',
    ...partial,
  };
}

describe('buildTuitionSummary', () => {
  it('counts tuition only, validated as paid, pending apart', () => {
    const summary = buildTuitionSummary(
      [
        { number: 2, amount: 30000, dueDate: '2027-02-01' },
        { number: 1, amount: 20000, dueDate: '2026-11-01' },
      ],
      [
        payment({ type: 'enrollment_fee', amount: 25000 }),
        payment({ installmentNumber: 1, amount: 20000 }),
        payment({ installmentNumber: 2, amount: 10000, status: 'declared' }),
        payment({ installmentNumber: 2, amount: 5000, status: 'rejected' }),
      ],
    );
    expect(summary.total).toBe(50000);
    expect(summary.paid).toBe(20000);
    expect(summary.pending).toBe(10000);
    expect(summary.remaining).toBe(30000);
    expect(summary.installments.map((i) => i.number)).toEqual([1, 2]);
    expect(summary.installments[0].remaining).toBe(0);
  });
});
