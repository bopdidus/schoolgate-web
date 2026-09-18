import { validateFeesChronological } from './school-form.validation';

describe('school-form.validation', () => {
  it('rejects non-chronological due dates', () => {
    const result = validateFeesChronological([
      { amount: 100, dueDate: '2026-12-01' },
      { amount: 100, dueDate: '2026-11-01' },
    ]);
    expect(result).toBe('SCHOOLS.DEADLINES_ORDER');
  });

  it('accepts chronological due dates', () => {
    const result = validateFeesChronological([
      { amount: 100, dueDate: '2026-10-01' },
      { amount: 100, dueDate: '2026-11-01' },
    ]);
    expect(result).toBeNull();
  });
});
