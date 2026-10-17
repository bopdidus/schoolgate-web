import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { FinanceService } from './finance.service';
import { FinanceService as FinanceApiService } from '../api';

describe('FinanceService', () => {
  let api: jasmine.SpyObj<FinanceApiService>;
  let service: FinanceService;

  beforeEach(() => {
    api = jasmine.createSpyObj<FinanceApiService>('FinanceApiService', [
      'schoolsIdFinanceSummaryGet',
      'schoolsIdFinanceSummaryExportGet',
      'schoolsIdFinanceArrearsGet',
      'schoolsIdFinanceArrearsExportGet',
      'schoolsIdEnrollmentsExportGet',
    ]);
    TestBed.configureTestingModule({ providers: [{ provide: FinanceApiService, useValue: api }] });
    service = TestBed.inject(FinanceService);
  });

  it('maps the summary from cents to francs, fee line as a null installment', (done) => {
    api.schoolsIdFinanceSummaryGet.and.returnValue(
      of({
        data: {
          period: 'week',
          installment_numbers: [1],
          series: [
            {
              start: '2026-10-12',
              total_cents: 7_500_000,
              lines: [{ amount_cents: 2_500_000 }, { installment_number: 1, amount_cents: 5_000_000 }],
            },
          ],
          total_cents: 7_500_000,
          today_cents: 100,
          week_cents: 7_500_000,
          month_cents: 7_500_000,
          pending_cents: 500_000,
        },
      }) as never,
    );
    service.getSummary('3', 'week').subscribe((s) => {
      expect(api.schoolsIdFinanceSummaryGet).toHaveBeenCalledWith(3, 'week');
      expect(s.period).toBe('week');
      expect(s.series[0].lines).toEqual([
        { installment: null, amount: 25000 },
        { installment: 1, amount: 50000 },
      ]);
      expect(s.today).toBe(1);
      expect(s.pending).toBe(5000);
      done();
    });
  });

  it('pages the arrears report and keeps the class filter numeric', (done) => {
    api.schoolsIdFinanceArrearsGet.and.returnValue(
      of({
        data: {
          academic_year: '2026-2027',
          as_of: '2026-10-17',
          count: 1,
          total_outstanding_cents: 7_000_000,
          rows: [{ enrollment_id: 3, student_name: 'Ada', outstanding_cents: 7_000_000, days_late: 12 }],
        },
      }) as never,
    );
    service.getArrears('3', { schoolClassId: '10', page: 2, pageSize: 50, asOf: '2026-10-17' }).subscribe((r) => {
      expect(api.schoolsIdFinanceArrearsGet).toHaveBeenCalledWith(3, 10, undefined, '2026-10-17', 50, 50);
      expect(r.totalOutstanding).toBe(70000);
      expect(r.rows[0]).toEqual(
        jasmine.objectContaining({ enrollmentId: '3', studentName: 'Ada', outstanding: 70000, daysLate: 12, currentInstallment: null }),
      );
      done();
    });
  });

  it('exports with the filters on screen, every class when none is picked', () => {
    const blob = new Blob(['x']);
    api.schoolsIdFinanceArrearsExportGet.and.returnValue(of(blob) as never);
    api.schoolsIdEnrollmentsExportGet.and.returnValue(of(blob) as never);
    api.schoolsIdFinanceSummaryExportGet.and.returnValue(of(blob) as never);

    service.exportArrears('3', { schoolClassId: '', academicYear: '2026-2027' }).subscribe();
    expect(api.schoolsIdFinanceArrearsExportGet).toHaveBeenCalledWith(3, undefined, '2026-2027', undefined);

    service.exportEnrolled('3', { schoolClassId: '10', tuitionSettled: false }).subscribe();
    expect(api.schoolsIdEnrollmentsExportGet).toHaveBeenCalledWith(3, 10, undefined, false);

    service.exportSummary('3', 'month').subscribe();
    expect(api.schoolsIdFinanceSummaryExportGet).toHaveBeenCalledWith(3, 'month');
  });
});
