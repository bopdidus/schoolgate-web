import {
  validateDeadlinesChronological,
  validatePaymentValidationDays,
} from './school-form.validation';

describe('school-form.validation', () => {
  it('rejects payment validation days above max', () => {
    expect(validatePaymentValidationDays(30)).toBe('SCHOOLS.PAYMENT_VALIDATION_DAYS_RANGE');
    expect(validatePaymentValidationDays(7)).toBeNull();
  });

  it('rejects non-chronological deadlines', () => {
    const result = validateDeadlinesChronological([
      { type: 'enrollment', deadlineDate: '2026-12-01' },
      { type: 'installment', installmentNumber: 1, deadlineDate: '2026-11-01' },
    ]);
    expect(result).toBe('SCHOOLS.DEADLINES_ORDER');
  });
});
