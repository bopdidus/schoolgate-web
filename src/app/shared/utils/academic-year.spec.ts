import { academicYearOf, selectableAcademicYears } from './academic-year';

describe('academic year', () => {
  it('switches to the new academic year in September', () => {
    expect(academicYearOf(new Date(2026, 7, 31))).toBe('2025-2026');
    expect(academicYearOf(new Date(2026, 8, 1))).toBe('2026-2027');
  });

  it('offers the coming year, the current one and past years, newest first', () => {
    expect(selectableAcademicYears(new Date(2026, 9, 7), 2)).toEqual([
      '2027-2028',
      '2026-2027',
      '2025-2026',
      '2024-2025',
    ]);
  });
});
