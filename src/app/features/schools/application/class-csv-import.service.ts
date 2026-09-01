import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of } from 'rxjs';
import { RefLevel, RefRepository, RefSpecialty } from '../../../core/ref/ref.repository';
import { EducationSystem, EducationType } from '../../../shared/models/common.model';
import { School, SchoolClass } from '../domain/models/school.model';
import { toUtcMidnightIso, validateFeesChronological } from './school-form.validation';

/** Column headers for the downloadable CSV template — order is informational only, matching is by header name. */
export const CLASS_CSV_HEADERS = [
  'name',
  'education_type',
  'specialty',
  'specialty_other',
  'pedagogic_system',
  'level',
  'total_seats',
  'enrollment_fee_amount',
  'enrollment_fee_due_date',
  'advance_allowed',
  'advance_percentage',
  'installment1_amount',
  'installment1_due_date',
  'installment2_amount',
  'installment2_due_date',
  'installment3_amount',
  'installment3_due_date',
] as const;

const EDUCATION_TYPES: EducationType[] = ['general', 'technical', 'vocational'];
const SYSTEMS: EducationSystem[] = ['francophone', 'anglophone'];

export interface ClassCsvRowResult {
  /** 1-based row number, excluding the header row. */
  index: number;
  raw: Record<string, string>;
  schoolClass?: SchoolClass;
  errors: string[];
}

@Injectable({ providedIn: 'root' })
export class ClassCsvImportService {
  private readonly refRepository = inject(RefRepository);

  /** Builds the downloadable CSV template with header row + one example row. */
  buildTemplate(): string {
    const example: Record<string, string> = {
      name: '6ème A',
      education_type: 'general',
      specialty: '',
      specialty_other: '',
      pedagogic_system: 'francophone',
      level: '6ème',
      total_seats: '60',
      enrollment_fee_amount: '25000',
      enrollment_fee_due_date: '2026-09-15',
      advance_allowed: 'false',
      advance_percentage: '',
      installment1_amount: '30000',
      installment1_due_date: '2026-11-01',
      installment2_amount: '30000',
      installment2_due_date: '2027-02-01',
      installment3_amount: '',
      installment3_due_date: '',
    };
    const rows = [CLASS_CSV_HEADERS.join(','), CLASS_CSV_HEADERS.map((h) => csvEscape(example[h])).join(',')];
    return rows.join('\r\n') + '\r\n';
  }

  /** Parses raw CSV text into header-keyed row objects (trims BOM, supports quoted fields). */
  parse(text: string): Record<string, string>[] {
    const records = parseCsvText(text.replace(/^\uFEFF/, ''));
    if (records.length === 0) return [];
    const headers = records[0].map((h) => h.trim().toLowerCase());
    return records.slice(1)
      .filter((cells) => cells.some((c) => c.trim() !== ''))
      .map((cells) => {
        const row: Record<string, string> = {};
        headers.forEach((h, i) => (row[h] = (cells[i] ?? '').trim()));
        return row;
      });
  }

  /** Validates + maps parsed rows into `SchoolClass` payloads, resolving level/specialty labels via the reference API. */
  buildRows(rows: Record<string, string>[], school: School, specialties: RefSpecialty[]): Observable<ClassCsvRowResult[]> {
    if (rows.length === 0) return of([]);

    const isBilingual = school.schoolSystem === 'bilingual';
    const defaultSystem: EducationSystem = school.schoolSystem === 'anglophone' ? 'anglophone' : 'francophone';

    const combos = new Set<string>();
    rows.forEach((row) => {
      const type = normalizeEducationType(row['education_type']);
      const system = isBilingual ? normalizeSystem(row['pedagogic_system']) : defaultSystem;
      if (type && system) combos.add(`${system}:${type}`);
    });

    const comboList = Array.from(combos);
    if (comboList.length === 0) {
      return of(rows.map((raw, i) => ({ index: i + 1, raw, errors: ['SCHOOLS.CSV.ERROR_EDUCATION_TYPE'] })));
    }

    return forkJoin(
      comboList.map((key) => {
        const [system, type] = key.split(':') as [EducationSystem, EducationType];
        return this.refRepository.getLevels(system, type).pipe(map((levels) => [key, levels] as const));
      }),
    ).pipe(
      map((entries) => {
        const levelsByCombo = new Map<string, RefLevel[]>(entries);
        return rows.map((raw, i) =>
          this.buildRow(i + 1, raw, { isBilingual, defaultSystem, levelsByCombo, specialties }),
        );
      }),
    );
  }

  private buildRow(
    index: number,
    raw: Record<string, string>,
    ctx: {
      isBilingual: boolean;
      defaultSystem: EducationSystem;
      levelsByCombo: Map<string, RefLevel[]>;
      specialties: RefSpecialty[];
    },
  ): ClassCsvRowResult {
    const errors: string[] = [];

    const name = raw['name']?.trim();
    if (!name) errors.push('SCHOOLS.CSV.ERROR_NAME');

    const educationType = normalizeEducationType(raw['education_type']);
    if (!educationType) errors.push('SCHOOLS.CSV.ERROR_EDUCATION_TYPE');

    const system = ctx.isBilingual ? normalizeSystem(raw['pedagogic_system']) : ctx.defaultSystem;
    if (ctx.isBilingual && !system) errors.push('SCHOOLS.CSV.ERROR_SYSTEM');

    let specialtyId: string | undefined;
    let specialtyOther: string | undefined;
    const specialtyLabel = raw['specialty']?.trim();
    const requiresSpecialty = educationType === 'technical' || educationType === 'vocational';
    if (requiresSpecialty) {
      if (!specialtyLabel) {
        errors.push('SCHOOLS.CSV.ERROR_SPECIALTY_REQUIRED');
      } else if (specialtyLabel.toLowerCase() === 'other' || specialtyLabel.toLowerCase() === 'autre') {
        specialtyId = 'other';
        specialtyOther = raw['specialty_other']?.trim();
        if (!specialtyOther) errors.push('SCHOOLS.CSV.ERROR_SPECIALTY_OTHER_REQUIRED');
      } else {
        const match = ctx.specialties.find((s) => s.label.toLowerCase() === specialtyLabel.toLowerCase());
        if (!match) {
          errors.push('SCHOOLS.CSV.ERROR_SPECIALTY_UNKNOWN');
        } else {
          specialtyId = match.id;
        }
      }
    }

    let levelId = '';
    let levelLabel: string | undefined;
    const levelText = raw['level']?.trim();
    if (!levelText) {
      errors.push('SCHOOLS.CSV.ERROR_LEVEL_REQUIRED');
    } else if (educationType && system) {
      const levels = ctx.levelsByCombo.get(`${system}:${educationType}`) ?? [];
      const match = levels.find((l) => l.label.toLowerCase() === levelText.toLowerCase());
      if (!match) {
        errors.push('SCHOOLS.CSV.ERROR_LEVEL_UNKNOWN');
      } else {
        levelId = match.id;
        levelLabel = match.label;
      }
    }

    const totalSeats = parseIntOrNaN(raw['total_seats']);
    if (!Number.isFinite(totalSeats) || totalSeats < 1) errors.push('SCHOOLS.CSV.ERROR_TOTAL_SEATS');

    const enrollmentAmount = parseFloatOrNaN(raw['enrollment_fee_amount']);
    if (!Number.isFinite(enrollmentAmount) || enrollmentAmount < 1) errors.push('SCHOOLS.CSV.ERROR_FEE_AMOUNT');

    const enrollmentDueDate = toUtcMidnightIso(raw['enrollment_fee_due_date']);
    if (!enrollmentDueDate) errors.push('SCHOOLS.CSV.ERROR_FEE_DATE');

    const advanceAllowed = parseBool(raw['advance_allowed']);
    const advancePercentage = parseFloatOrNaN(raw['advance_percentage']);
    if (advanceAllowed && (!Number.isFinite(advancePercentage) || advancePercentage < 1 || advancePercentage > 100)) {
      errors.push('SCHOOLS.CSV.ERROR_ADVANCE_PERCENTAGE');
    }

    const installments = [];
    for (const n of [1, 2, 3]) {
      const amountRaw = raw[`installment${n}_amount`]?.trim();
      const dueDateRaw = raw[`installment${n}_due_date`]?.trim();
      if (!amountRaw && !dueDateRaw) continue;
      const amount = parseFloatOrNaN(amountRaw);
      const dueDate = toUtcMidnightIso(dueDateRaw);
      if (!Number.isFinite(amount) || amount < 1 || !dueDate) {
        errors.push('SCHOOLS.CSV.ERROR_INSTALLMENT');
        continue;
      }
      installments.push({ order: n, amount, dueDate, advanceAllowed: false });
    }

    const chronoErr = validateFeesChronological([
      { amount: enrollmentAmount, dueDate: enrollmentDueDate },
      ...installments,
    ]);
    if (chronoErr) errors.push('SCHOOLS.DEADLINES_ORDER');

    if (errors.length > 0) {
      return { index, raw, errors };
    }

    const schoolClass: SchoolClass = {
      system: ctx.isBilingual ? system ?? undefined : undefined,
      educationType: educationType!,
      specialtyId: specialtyId === 'other' ? undefined : specialtyId,
      specialtyOther,
      levelId,
      levelLabel,
      name: name!,
      totalSeats,
      advanceAllowed,
      enrollmentFee: {
        amount: enrollmentAmount,
        dueDate: enrollmentDueDate,
        advancePercentage: advanceAllowed ? advancePercentage : undefined,
      },
      installments,
    };

    return { index, raw, schoolClass, errors: [] };
  }
}

function normalizeEducationType(value: string | undefined): EducationType | null {
  const v = value?.trim().toLowerCase();
  return (EDUCATION_TYPES as string[]).includes(v ?? '') ? (v as EducationType) : null;
}

function normalizeSystem(value: string | undefined): EducationSystem | null {
  const v = value?.trim().toLowerCase();
  return (SYSTEMS as string[]).includes(v ?? '') ? (v as EducationSystem) : null;
}

function parseBool(value: string | undefined): boolean {
  const v = value?.trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes' || v === 'oui';
}

function parseIntOrNaN(value: string | undefined): number {
  if (!value || value.trim() === '') return NaN;
  return Number.parseInt(value.replace(/[^\d-]/g, ''), 10);
}

function parseFloatOrNaN(value: string | undefined): number {
  if (!value || value.trim() === '') return NaN;
  return Number.parseFloat(value.replace(/[^\d.-]/g, ''));
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Minimal RFC4180 CSV parser: supports quoted fields, escaped quotes, CRLF/LF, commas/newlines inside quotes. */
function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === ',') {
      row.push(field);
      field = '';
      i += 1;
      continue;
    }
    if (char === '\r') {
      i += 1;
      continue;
    }
    if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i += 1;
      continue;
    }
    field += char;
    i += 1;
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}
