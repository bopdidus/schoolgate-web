import { enrollmentFeeProgress, tuitionSummaryFor } from './balance';
import { ClassInstallment, ClassOffering, ParentPayment, ParentPaymentStatus, ParentPaymentType } from './models';
import { minAdvanceCents, serviceFeeCents } from './money';
import { PayableLine, PayableLines } from './payable-lines';

// Same cases as the mobile app's tests (payable_lines_test.dart,
// tuition_summary_test.dart) and the API's: the three must agree.

function offering(partial: Partial<ClassOffering> = {}): ClassOffering {
  return {
    id: '1',
    schoolId: '1',
    label: '6ème',
    educationType: 'general',
    enrollmentFeeCents: 1_234_500,
    advanceAllowed: true,
    advancePercentage: 30,
    installments: [],
    totalSeats: 30,
    seatsRemaining: 10,
    ...partial,
  };
}

function inst(number: number, amountCents: number, advance = false, pct = 0): ClassInstallment {
  return { number, amountCents, dueDate: '2027-01-01', advanceAllowed: advance, advancePercentage: pct };
}

function paid(type: ParentPaymentType, amountCents: number, status: ParentPaymentStatus, installmentNumber?: number): ParentPayment {
  return { id: 'p', enrollmentId: 'e', type, amountCents, feeCents: 0, status, installmentNumber };
}

describe('money (mirrors the API)', () => {
  it('rounds the minimum advance up to a whole franc: 30 % of 12 345 F = 3 704 F', () => {
    expect(minAdvanceCents(1_234_500, 30)).toBe(370_400);
  });

  it('keeps the minimum advance between one franc and the whole line', () => {
    expect(minAdvanceCents(1_000, 1)).toBe(100);
    expect(minAdvanceCents(5_000, 100)).toBe(5_000);
    expect(minAdvanceCents(5_000, 0)).toBe(5_000);
  });

  it('rounds the service fee up to a whole franc: 2.5 % of 3 704 F = 93 F', () => {
    expect(serviceFeeCents(2.5, 370_400)).toBe(9_300);
    expect(serviceFeeCents(0, 370_400)).toBe(0);
    expect(serviceFeeCents(2, 5_000_000)).toBe(100_000);
  });
});

describe('PayableLine', () => {
  it('uses the class-level advance on the enrollment fee', () => {
    const line = PayableLine.enrollmentFee(offering(), [])!;
    expect(line.remainingCents).toBe(1_234_500);
    expect(line.canPayAdvance).toBeTrue();
    expect(line.amountCents(true)).toBe(370_400);
    expect(line.amountCents(false)).toBe(1_234_500);
  });

  it('after an advance, only the exact balance can be paid', () => {
    const line = PayableLine.enrollmentFee(offering(), [paid('enrollment_fee', 370_400, 'validated')])!;
    expect(line.remainingCents).toBe(864_100);
    expect(line.canPayAdvance).toBeFalse();
    expect(line.amountCents(true)).toBe(864_100);
  });

  it('is gone once fully held; rejected or refunded payments hold nothing', () => {
    expect(PayableLine.enrollmentFee(offering(), [paid('enrollment_fee', 1_234_500, 'declared')])).toBeNull();
    for (const status of ['rejected', 'refunded', 'refund_pending'] as ParentPaymentStatus[]) {
      expect(PayableLine.enrollmentFee(offering(), [paid('enrollment_fee', 1_234_500, status)])!.remainingCents)
        .withContext(status)
        .toBe(1_234_500);
    }
  });

  it("starts with installment 1, using that installment's own advance", () => {
    const o = offering({ installments: [inst(2, 3_000_000), inst(1, 2_000_000, true, 25)] });
    const line = PayableLine.nextInstallment(o, [])!;
    expect(line.installmentNumber).toBe(1);
    expect(line.amountCents(true)).toBe(500_000);
  });

  it('moves to the next installment once the previous one is covered', () => {
    const o = offering({ installments: [inst(2, 3_000_000), inst(1, 2_000_000, true, 25)] });
    const line = PayableLine.nextInstallment(o, [paid('tuition_installment', 2_000_000, 'validated', 1)])!;
    expect(line.installmentNumber).toBe(2);
    expect(line.canPayAdvance).toBeFalse();
  });
});

describe('PayableLines', () => {
  it('offers combined, fee only and installment only while both are owed', () => {
    const lines = PayableLines.from(offering({ installments: [inst(1, 2_000_000)] }), []);
    expect(lines.available).toEqual(['combined', 'enrollment_only', 'installment_only']);
    expect(lines.items('combined', false).map((i) => i.amountCents)).toEqual([1_234_500, 2_000_000]);
  });

  it('never offers the enrollment fee in the tuition-only flow', () => {
    const lines = PayableLines.from(offering({ installments: [inst(1, 2_000_000)] }), [], true);
    expect(lines.available).toEqual(['installment_only']);
    expect(lines.resolve('combined')).toBe('installment_only');
  });

  it('has nothing to pay once everything is held', () => {
    const o = offering({ installments: [inst(1, 2_000_000)] });
    const lines = PayableLines.from(o, [
      paid('enrollment_fee', 1_234_500, 'validated'),
      paid('tuition_installment', 2_000_000, 'declared', 1),
    ]);
    expect(lines.resolve('combined')).toBeNull();
  });
});

describe('balance', () => {
  const o = offering({ enrollmentFeeCents: 2_500_000, installments: [inst(2, 3_000_000), inst(1, 2_000_000)] });

  it('tuition: installments only, validated as paid, pending apart', () => {
    const summary = tuitionSummaryFor(o, [
      paid('enrollment_fee', 2_500_000, 'validated'),
      paid('tuition_installment', 2_000_000, 'validated', 1),
      paid('tuition_installment', 1_000_000, 'declared', 2),
      paid('tuition_installment', 500_000, 'rejected', 2),
    ]);
    expect(summary.total).toBe(5_000_000);
    expect(summary.paid).toBe(2_000_000);
    expect(summary.pending).toBe(1_000_000);
    expect(summary.remaining).toBe(3_000_000);
    expect(summary.installments.map((i) => i.number)).toEqual([1, 2]);
  });

  it('enrollment fee: amount, paid, pending apart, remaining', () => {
    const fee = enrollmentFeeProgress(o, [
      paid('enrollment_fee', 1_000_000, 'validated'),
      paid('enrollment_fee', 500_000, 'declared'),
      paid('tuition_installment', 2_000_000, 'validated', 1),
    ]);
    expect(fee).toEqual({ totalCents: 2_500_000, paidCents: 1_000_000, pendingCents: 500_000, remainingCents: 1_500_000, settled: false });
  });
});
