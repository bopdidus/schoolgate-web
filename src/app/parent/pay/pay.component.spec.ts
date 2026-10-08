import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { provideTestDefaults } from '../../../testing/test-providers';
import { PayComponent, normalizeMsisdn } from './pay.component';
import { ParentEnrollmentsService } from '../services/parent-enrollments.service';
import { ParentPaymentsService } from '../services/parent-payments.service';
import { ParentSchoolsService } from '../services/parent-schools.service';
import { ParentEnrollment, ParentPayment } from '../domain/models';

const ENROLLMENT: ParentEnrollment = {
  id: '9',
  status: 'active',
  academicYear: '2026-2027',
  isReturningStudent: false,
  requiresDocuments: false,
  paymentValidated: false,
  createdAt: '2026-09-01',
  schoolId: '3',
  schoolName: 'Lycée X',
  offering: {
    id: '7',
    schoolId: '3',
    label: '6ème',
    educationType: 'general',
    enrollmentFeeCents: 1_000_000,
    advanceAllowed: false,
    advancePercentage: 0,
    installments: [{ number: 1, amountCents: 2_000_000, dueDate: '2027-01-01', advanceAllowed: false, advancePercentage: 0 }],
    totalSeats: 10,
    seatsRemaining: 3,
  },
};

function payment(status: ParentPayment['status']): ParentPayment {
  return { id: '50', enrollmentId: '9', type: 'enrollment_fee', amountCents: 1_000_000, feeCents: 0, status };
}

describe('normalizeMsisdn', () => {
  it('accepts spaces and the +237 / 00237 prefix', () => {
    expect(normalizeMsisdn('+237 6 70 00 00 00')).toBe('670000000');
    expect(normalizeMsisdn('00237670000000')).toBe('670000000');
    expect(normalizeMsisdn('670-000-000')).toBe('670000000');
  });
});

describe('PayComponent', () => {
  let fixture: ComponentFixture<PayComponent>;
  let payments: jasmine.SpyObj<ParentPaymentsService>;
  let router: Router;

  beforeEach(async () => {
    payments = jasmine.createSpyObj<ParentPaymentsService>('ParentPaymentsService', ['forEnrollment', 'feePercent', 'declare', 'sync']);
    payments.forEnrollment.and.returnValue(of([]));
    payments.feePercent.and.returnValue(of(2));
    payments.declare.and.returnValue(of(payment('declared')));
    payments.sync.and.returnValue(of(payment('validated')));

    await TestBed.configureTestingModule({
      imports: [PayComponent],
      providers: [
        ...provideTestDefaults(),
        provideRouter([]),
        { provide: ParentPaymentsService, useValue: payments },
        { provide: ParentEnrollmentsService, useValue: { getById: () => of(ENROLLMENT) } },
        { provide: ParentSchoolsService, useValue: { paymentMethods: () => of(['mtn']) } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(PayComponent);
    fixture.componentRef.setInput('id', '9');
    fixture.detectChanges();
  });

  it('offers the lines still owed, with the service fee on top', () => {
    const c = fixture.componentInstance;
    expect(c.lines()!.available).toEqual(['combined', 'enrollment_only', 'installment_only']);
    expect(c.schoolCents()).toBe(3_000_000);
    expect(c.feeCents()).toBe(60_000); // 2 % of each line
    expect(c.method()).toBe('mtn');
  });

  it('refuses a number that is not a Cameroon mobile', async () => {
    const c = fixture.componentInstance;
    c.msisdn.setValue('22 00 00 00');
    await c.pay();
    expect(payments.declare).not.toHaveBeenCalled();
    expect(c.msisdn.hasError('msisdn')).toBeTrue();
  });

  it('pays each line, follows it until validated, then confirms', async () => {
    const c = fixture.componentInstance;
    c.option.set('enrollment_only');
    c.msisdn.setValue('+237 670 00 00 00');
    await c.pay();
    expect(payments.declare).toHaveBeenCalledOnceWith('9', jasmine.objectContaining({ type: 'enrollment_fee', amountCents: 1_000_000 }), 'mtn', '670000000');
    expect(payments.sync).toHaveBeenCalledWith('50');
    expect(router.navigate).toHaveBeenCalledWith(['/parent/confirmation', '9']);
  });

  it('stops and explains when the operator refuses', async () => {
    payments.sync.and.returnValue(of(payment('rejected')));
    const c = fixture.componentInstance;
    c.option.set('enrollment_only');
    c.msisdn.setValue('670000000');
    await c.pay();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(c.error()).toBeTruthy();
    expect(c.submitting()).toBeFalse();
  });
});
