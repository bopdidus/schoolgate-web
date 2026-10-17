import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CLASS_CSV_HEADERS, ClassCsvImportService, ClassCsvRowResult } from './class-csv-import.service';
import { RefService } from '../core/services/ref.service';
import { School } from './school.model';

const SPECIALTIES = [{ id: '4', code: 'ELEC', label: 'Électronique' }];

describe('ClassCsvImportService', () => {
  let service: ClassCsvImportService;
  let getLevels: jasmine.Spy;

  beforeEach(() => {
    getLevels = jasmine.createSpy('getLevels').and.callFake((system: string, type: string) =>
      of(
        system === 'anglophone'
          ? [{ id: '20', code: 'F1', label: 'Form 1', system, educationType: type }]
          : [{ id: '10', code: '6E', label: '6ème', system, educationType: type }],
      ),
    );
    TestBed.configureTestingModule({ providers: [{ provide: RefService, useValue: { getLevels } }] });
    service = TestBed.inject(ClassCsvImportService);
  });

  const school = (schoolSystem: School['schoolSystem']) => ({ id: '1', schoolSystem }) as School;

  const build = (csv: string, s: School): ClassCsvRowResult[] => {
    let out: ClassCsvRowResult[] = [];
    service.buildRows(service.parse(csv), s, SPECIALTIES).subscribe((r) => (out = r));
    return out;
  };

  it('ships a template per system that imports cleanly', () => {
    for (const system of ['francophone', 'anglophone'] as const) {
      const template = service.buildTemplate(system);
      expect(template.split('\r\n')[0]).toBe(CLASS_CSV_HEADERS.join(','));
      const [row] = build(template, school(system));
      expect(row.errors).toEqual([]);
      expect(row.schoolClass?.levelLabel).toBe(system === 'anglophone' ? 'Form 1' : '6ème');
      expect(row.schoolClass?.installments.length).toBe(2);
    }
  });

  it('parses quoted fields, escaped quotes, a BOM and skips blank lines', () => {
    const rows = service.parse('﻿Name,Level\r\n"6ème ""A"", soir",6ème\r\n,\r\n');
    expect(rows).toEqual([{ name: '6ème "A", soir', level: '6ème' }]);
  });

  it('explains every mistake of a row', () => {
    const csv = [
      'name,education_type,specialty,level,total_seats,enrollment_fee_amount,enrollment_fee_due_date,advance_allowed,advance_percentage,installment1_amount,installment1_due_date',
      ',technical,Plomberie,Terminale,0,abc,,oui,150,1000,',
    ].join('\n');
    const [row] = build(csv, school('francophone'));
    expect(row.schoolClass).toBeUndefined();
    expect(row.errors).toEqual(
      jasmine.arrayContaining([
        'SCHOOLS.CSV.ERROR_NAME',
        'SCHOOLS.CSV.ERROR_SPECIALTY_UNKNOWN',
        'SCHOOLS.CSV.ERROR_LEVEL_UNKNOWN',
        'SCHOOLS.CSV.ERROR_TOTAL_SEATS',
        'SCHOOLS.CSV.ERROR_FEE_AMOUNT',
        'SCHOOLS.CSV.ERROR_FEE_DATE',
        'SCHOOLS.CSV.ERROR_ADVANCE_PERCENTAGE',
        'SCHOOLS.CSV.ERROR_INSTALLMENT',
      ]),
    );
  });

  it('resolves a known specialty and an "other" one', () => {
    const header = 'name,education_type,specialty,specialty_other,level,total_seats,enrollment_fee_amount,enrollment_fee_due_date';
    const [known, other, otherMissing] = build(
      [header, 'T1,technical,électronique,,6ème,30,25000,2026-09-15', 'T2,technical,Autre,Froid,6ème,30,25000,2026-09-15', 'T3,technical,other,,6ème,30,25000,2026-09-15'].join('\n'),
      school('francophone'),
    );
    expect(known.schoolClass?.specialtyId).toBe('4');
    expect(other.schoolClass?.specialtyOther).toBe('Froid');
    expect(otherMissing.errors).toContain('SCHOOLS.CSV.ERROR_SPECIALTY_OTHER_REQUIRED');
  });

  it('needs the system of each class in a bilingual school', () => {
    const header = 'name,education_type,pedagogic_system,level,total_seats,enrollment_fee_amount,enrollment_fee_due_date';
    const [en, missing] = build(
      [header, 'F1,general,anglophone,Form 1,30,25000,2026-09-15', 'X,general,,Form 1,30,25000,2026-09-15'].join('\n'),
      school('bilingual'),
    );
    expect(en.schoolClass?.system).toBe('anglophone');
    expect(missing.errors).toContain('SCHOOLS.CSV.ERROR_SYSTEM');
  });

  it('refuses installments due before the enrollment fee', () => {
    const csv = [
      'name,education_type,level,total_seats,enrollment_fee_amount,enrollment_fee_due_date,installment1_amount,installment1_due_date',
      '6A,general,6ème,30,25000,2026-12-01,30000,2026-10-01',
    ].join('\n');
    expect(build(csv, school('francophone'))[0].errors).toContain('SCHOOLS.DEADLINES_ORDER');
  });

  it('marks every row when no education type is usable', () => {
    const rows = build('name,education_type\nA,cooking', school('francophone'));
    expect(rows[0].errors).toEqual(['SCHOOLS.CSV.ERROR_EDUCATION_TYPE']);
    expect(getLevels).not.toHaveBeenCalled();
  });
});
