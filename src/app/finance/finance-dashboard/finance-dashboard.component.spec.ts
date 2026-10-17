import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { FinanceDashboardComponent } from './finance-dashboard.component';
import { FinanceService } from '../finance.service';
import { FinanceSummary } from '../finance.model';
import { provideTestDefaults } from '../../../testing/test-providers';
import { HeaderNotificationsService } from '../../core/services/header-notifications.service';
import { selectUser } from '../../core/store/auth.reducer';

const SUMMARY: FinanceSummary = {
  period: 'day',
  installmentNumbers: [1, 2],
  series: [
    {
      start: '2026-10-19T00:00:00+01:00',
      total: 60000,
      lines: [
        { installment: null, amount: 10000 },
        { installment: 1, amount: 50000 },
        { installment: 2, amount: 0 },
      ],
    },
  ],
  total: 60000,
  today: 0,
  week: 60000,
  month: 60000,
  pending: 5000,
};

describe('FinanceDashboardComponent', () => {
  let fixture: ComponentFixture<FinanceDashboardComponent>;
  let finance: jasmine.SpyObj<FinanceService>;
  let events: Subject<{ type: string; data?: Record<string, unknown> }>;

  beforeEach(async () => {
    finance = jasmine.createSpyObj<FinanceService>('FinanceService', ['getSummary', 'exportSummary']);
    finance.getSummary.and.returnValue(of(SUMMARY));
    finance.exportSummary.and.returnValue(of(new Blob(['x'])));
    events = new Subject();

    await TestBed.configureTestingModule({
      imports: [FinanceDashboardComponent],
      providers: [
        ...provideTestDefaults(),
        provideMockStore({ selectors: [{ selector: selectUser, value: { role: 'school_admin', schoolId: '7' } }] }),
        { provide: FinanceService, useValue: finance },
        { provide: HeaderNotificationsService, useValue: { events$: events.asObservable() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FinanceDashboardComponent);
    fixture.detectChanges();
  });

  // overrideSelector patches the shared memoized selector: undo it so other specs see a real store.
  afterEach(() => TestBed.inject(MockStore).resetSelectors());

  it('loads the daily summary of the staff school', () => {
    expect(finance.getSummary).toHaveBeenCalledWith('7', 'day');
    expect(fixture.componentInstance.chartData.datasets.length).toBe(3);
  });

  it('switches period', () => {
    fixture.componentInstance.onPeriodChange('month');
    expect(finance.getSummary).toHaveBeenCalledWith('7', 'month');
  });

  it('reloads once after a burst of validated payments of this school only', fakeAsync(() => {
    finance.getSummary.calls.reset();
    events.next({ type: 'payment_validated', data: { school_id: 99 } });
    events.next({ type: 'payment_validated', data: { school_id: 7 } });
    events.next({ type: 'payment_validated', data: { school_id: 7 } });
    tick(1100);
    expect(finance.getSummary).toHaveBeenCalledTimes(1);
  }));

  it('exports the current period', () => {
    spyOn(URL, 'createObjectURL').and.returnValue('blob:x');
    fixture.componentInstance.onPeriodChange('week');
    fixture.componentInstance.exportExcel();
    expect(finance.exportSummary).toHaveBeenCalledWith('7', 'week');
  });
});
