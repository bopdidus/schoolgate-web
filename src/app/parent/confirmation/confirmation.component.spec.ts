import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ConfirmationComponent } from './confirmation.component';
import { provideTestDefaults } from '../../../testing/test-providers';
import { ParentEnrollmentsService } from '../services/parent-enrollments.service';
import { ParentPaymentsService } from '../services/parent-payments.service';
import { ParentEnrollment, ParentPayment } from '../domain/models';

const ENROLLMENT = { id: '3', status: 'active', schoolId: '1', schoolName: 'Lycée X', academicYear: '2026-2027' } as ParentEnrollment;

describe('ConfirmationComponent', () => {
  let fixture: ComponentFixture<ConfirmationComponent>;

  async function setup(payments: ParentPayment[], enrollment$ = of(ENROLLMENT)): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [ConfirmationComponent],
      providers: [
        ...provideTestDefaults(),
        { provide: ParentEnrollmentsService, useValue: { getById: () => enrollment$ } },
        { provide: ParentPaymentsService, useValue: { forEnrollment: () => of(payments) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ConfirmationComponent);
    fixture.componentRef.setInput('id', '3');
    fixture.detectChanges();
  }

  const pay = (p: Partial<ParentPayment>): ParentPayment =>
    ({ id: '1', enrollmentId: '3', type: 'enrollment_fee', amountCents: 100, feeCents: 0, status: 'validated', ...p }) as ParentPayment;

  it('says the payment is done once the operator validated it', async () => {
    await setup([pay({})]);
    expect(fixture.componentInstance.awaitingSchool()).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('PARENT.PAYMENT_DONE_TITLE');
  });

  it('says the school must still confirm a manual payment', async () => {
    await setup([pay({ manual: true, status: 'declared' })]);
    expect(fixture.componentInstance.awaitingSchool()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('PARENT.MANUAL_DECLARED_TITLE');
  });

  it('labels each line', async () => {
    await setup([]);
    const c = fixture.componentInstance;
    expect(c.paymentLabel(pay({}))).toBe('PARENT.ENROLLMENT_FEE');
    expect(c.paymentLabel(pay({ type: 'tuition_installment', installmentNumber: 2 }))).toBe('PARENT.INSTALLMENT_N');
  });

  it('shows an error state when the enrollment cannot load', async () => {
    await setup([], throwError(() => new Error('down')));
    expect(fixture.componentInstance.failed()).toBeTrue();
  });
});
