import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { ArrearsReportComponent } from './arrears-report.component';
import { FinanceService } from '../finance.service';
import { ArrearsReport } from '../finance.model';
import { SchoolService } from '../../schools/school.service';
import { provideTestDefaults } from '../../../testing/test-providers';
import { selectUser } from '../../core/store/auth.reducer';

const REPORT: ArrearsReport = {
  academicYear: '2026-2027',
  asOf: '2026-10-20T22:59:59Z',
  count: 1,
  totalOutstanding: 70000,
  rows: [
    {
      enrollmentId: '3',
      studentName: 'Ada Lovelace',
      matricule: 'LX-001',
      schoolClassName: '6ème',
      parentName: 'Parent Ada',
      parentPhone: '690000000',
      parentEmail: 'p@x.cm',
      due: 70000,
      paid: 0,
      outstanding: 70000,
      currentInstallment: 1,
      daysLate: 35,
    },
  ],
};

describe('ArrearsReportComponent', () => {
  let fixture: ComponentFixture<ArrearsReportComponent>;
  let finance: jasmine.SpyObj<FinanceService>;

  beforeEach(async () => {
    finance = jasmine.createSpyObj<FinanceService>('FinanceService', ['getArrears', 'exportArrears']);
    finance.getArrears.and.returnValue(of(REPORT));
    finance.exportArrears.and.returnValue(of(new Blob(['x'])));

    await TestBed.configureTestingModule({
      imports: [ArrearsReportComponent],
      providers: [
        ...provideTestDefaults(),
        provideMockStore({ selectors: [{ selector: selectUser, value: { role: 'school_editor', schoolId: '7' } }] }),
        { provide: FinanceService, useValue: finance },
        {
          provide: SchoolService,
          useValue: { getById: () => of({ classes: [{ id: '10', levelLabel: '6ème', name: '6ème' }] }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ArrearsReportComponent);
    fixture.detectChanges();
  });

  // overrideSelector patches the shared memoized selector: undo it so other specs see a real store.
  afterEach(() => TestBed.inject(MockStore).resetSelectors());

  const rows = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row'));

  it('lists the students behind for every class by default', () => {
    expect(finance.getArrears).toHaveBeenCalledWith('7', jasmine.objectContaining({ schoolClassId: undefined, page: 1 }));
    expect(rows().length).toBe(1);
    expect(rows()[0].textContent).toContain('Ada Lovelace');
    expect(fixture.nativeElement.querySelector('a[href="tel:690000000"]')).not.toBeNull();
  });

  it('filters by class in one click', () => {
    fixture.componentInstance.onClassChange('10');
    expect(finance.getArrears).toHaveBeenCalledWith('7', jasmine.objectContaining({ schoolClassId: '10', page: 1 }));
  });

  it('exports exactly the filters on screen', () => {
    spyOn(URL, 'createObjectURL').and.returnValue('blob:x');
    fixture.componentInstance.onClassChange('10');
    fixture.componentInstance.onAsOfChange('2026-11-15');
    fixture.componentInstance.exportExcel();
    expect(finance.exportArrears).toHaveBeenCalledWith(
      '7',
      jasmine.objectContaining({ schoolClassId: '10', asOf: '2026-11-15' }),
    );
  });
});
