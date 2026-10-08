/**
 * Academic year for a date, Cameroon school calendar: from September onward it
 * is `YYYY-(YYYY+1)`, otherwise `(YYYY-1)-YYYY`. Same rule as the API
 * (SchoolGateApi internal/models/academicyear).
 */
export function academicYearOf(date: Date): string {
  const year = date.getFullYear();
  const start = date.getMonth() >= 8 ? year : year - 1; // getMonth(): 8 = September.
  return `${start}-${start + 1}`;
}

/**
 * Academic years offered in filters, newest first: the coming year (requests
 * can be made ahead), the current one, then `past` previous years.
 */
export function selectableAcademicYears(now: Date = new Date(), past = 4): string[] {
  const start = Number(academicYearOf(now).slice(0, 4));
  const years: string[] = [];
  for (let s = start + 1; s >= start - past; s--) {
    years.push(`${s}-${s + 1}`);
  }
  return years;
}
