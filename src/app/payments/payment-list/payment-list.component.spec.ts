import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { PaymentListComponent } from './payment-list.component';
import { provideTestDefaults } from '../../../testing/test-providers';
import { PaymentService } from '../payment.service';
import { Payment } from '../payment.model';
import { selectUser } from '../../core/store/auth.reducer';

const MANUAL: Payment = {
  id: '7',
  enrollmentId: '3',
  type: 'enrollment_fee',
  amount: 50000,
  declaredAt: '2026-10-17T08:00:00Z',
  deadline: '2026-10-22T08:00:00Z',
  status: 'declared',
  schoolId: '1',
  schoolName: 'Lycée X',
  studentName: 'Ada Lovelace',
  classEducationType: 'general',
  method: 'orange',
  manual: true,
  mobileMoneyReference: 'MP231017.1234',
  payerMsisdn: '690000000',
};

describe('PaymentListComponent', () => {
  let fixture: ComponentFixture<PaymentListComponent>;
  let payments: jasmine.SpyObj<PaymentService>;
  let dialogResult: unknown;

  async function setup(role: string): Promise<void> {
    payments = jasmine.createSpyObj<PaymentService>('PaymentService', ['getAll', 'confirm', 'reject']);
    payments.getAll.and.returnValue(of({ data: [MANUAL], total: 1, page: 1, page_size: 10 }));
    payments.confirm.and.returnValue(of(undefined));
    payments.reject.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [PaymentListComponent],
      providers: [
        ...provideTestDefaults(),
        provideMockStore({ selectors: [{ selector: selectUser, value: { role, schoolId: '1' } }] }),
        { provide: PaymentService, useValue: payments },
        { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(dialogResult) }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentListComponent);
    fixture.detectChanges();
  }

  afterEach(() => TestBed.inject(MockStore).resetSelectors());

  it('shows the parent reference and lets school staff confirm a manual payment', async () => {
    await setup('school_editor');
    expect(fixture.nativeElement.textContent).toContain('MP231017.1234');

    dialogResult = { confirmed: true };
    fixture.componentInstance.confirm(MANUAL);
    expect(payments.confirm).toHaveBeenCalledWith('7');
  });

  it('rejects only with a reason', async () => {
    await setup('school_admin');
    dialogResult = { confirmed: true, reason: '  ' };
    fixture.componentInstance.reject(MANUAL);
    expect(payments.reject).not.toHaveBeenCalled();

    dialogResult = { confirmed: true, reason: 'Aucun transfert reçu' };
    fixture.componentInstance.reject(MANUAL);
    expect(payments.reject).toHaveBeenCalledWith('7', 'Aucun transfert reçu');
  });

  it('never offers the actions to a platform admin', async () => {
    await setup('admin');
    expect(fixture.componentInstance.canReview(MANUAL)).toBeFalse();
  });

  it('offers the actions on manual payments only', async () => {
    await setup('school_admin');
    expect(fixture.componentInstance.canReview({ ...MANUAL, manual: false })).toBeFalse();
    expect(fixture.componentInstance.canReview(MANUAL)).toBeTrue();
  });

  it('filters the payments waiting for the school', async () => {
    await setup('school_admin');
    fixture.componentInstance.statusFilter.set('to_confirm');
    fixture.componentInstance.load();
    expect(payments.getAll).toHaveBeenCalledWith(jasmine.objectContaining({ status: 'declared', manual: true }));
  });
});
