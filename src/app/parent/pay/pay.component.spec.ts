import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { PayComponent, normalizeMsisdn, normalizeReference } from './pay.component';
import { provideTestDefaults } from '../../../testing/test-providers';
import { ParentEnrollmentsService } from '../services/parent-enrollments.service';
import { ParentPaymentsService } from '../services/parent-payments.service';
import { ParentSchoolsService } from '../services/parent-schools.service';
import { AcceptedChannel, ParentEnrollment, ParentPayment, ParentSchool } from '../domain/models';

const ENROLLMENT: ParentEnrollment = {
  id: '3',
  status: 'active',
  academicYear: '2026-2027',
  isReturningStudent: false,
  requiresDocuments: false,
  paymentValidated: false,
  createdAt: '2026-09-01',
  schoolId: '1',
  schoolName: 'Lycée X',
  offering: {
    id: '10',
    schoolId: '1',
    label: '6ème',
    educationType: 'general',
    enrollmentFeeCents: 2_500_000,
    advanceAllowed: false,
    advancePercentage: 0,
    installments: [{ number: 1, amountCents: 5_000_000, dueDate: '2026-11-15', advanceAllowed: false, advancePercentage: 0 }],
    totalSeats: 30,
    seatsRemaining: 10,
  },
};

const MANUAL_ORANGE: AcceptedChannel = { method: 'orange', manual: true, number: '690000000', accountName: 'Lycée X', merchantCode: '123456' };
const DIRECT_MTN: AcceptedChannel = { method: 'mtn', manual: false, number: '', accountName: '', merchantCode: '' };

function payment(status: ParentPayment['status']): ParentPayment {
  return { id: '7', enrollmentId: '3', type: 'enrollment_fee', amountCents: 2_500_000, feeCents: 0, status };
}

describe('PayComponent', () => {
  let fixture: ComponentFixture<PayComponent>;
  let payments: jasmine.SpyObj<ParentPaymentsService>;
  let schools: jasmine.SpyObj<ParentSchoolsService>;
  let router: Router;

  async function setup(channels: AcceptedChannel[], school: Partial<ParentSchool> = {}): Promise<void> {
    payments = jasmine.createSpyObj<ParentPaymentsService>('ParentPaymentsService', ['forEnrollment', 'feePercent', 'declare', 'sync']);
    payments.forEnrollment.and.returnValue(of([]));
    payments.feePercent.and.returnValue(of(0));
    payments.declare.and.returnValue(of(payment('declared')));
    payments.sync.and.returnValue(of(payment('validated')));
    schools = jasmine.createSpyObj<ParentSchoolsService>('ParentSchoolsService', ['paymentMethods', 'getById']);
    schools.paymentMethods.and.returnValue(of(channels));
    schools.getById.and.returnValue(of({ phone: '233 42 00 00', ...school } as ParentSchool));

    await TestBed.configureTestingModule({
      imports: [PayComponent],
      providers: [
        ...provideTestDefaults(),
        { provide: ParentEnrollmentsService, useValue: { getById: () => of(ENROLLMENT) } },
        { provide: ParentPaymentsService, useValue: payments },
        { provide: ParentSchoolsService, useValue: schools },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(PayComponent);
    fixture.componentRef.setInput('id', '3');
    fixture.detectChanges();
  }

  it('offers both lines and pays each through the operator, then confirms', async () => {
    await setup([DIRECT_MTN]);
    const c = fixture.componentInstance;
    expect(c.lines()?.available).toEqual(['combined', 'enrollment_only', 'installment_only']);
    expect(c.schoolCents()).toBe(7_500_000);

    c.msisdn.setValue('+237 670 00 00 00');
    await c.pay();

    expect(payments.declare).toHaveBeenCalledTimes(2);
    expect(payments.declare.calls.argsFor(0)).toEqual(['3', jasmine.objectContaining({ type: 'enrollment_fee' }), 'mtn', '670000000']);
    expect(payments.sync).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/parent/confirmation', '3']);
  });

  it('refuses a number that is not a Cameroon mobile', async () => {
    await setup([DIRECT_MTN]);
    const c = fixture.componentInstance;
    c.msisdn.setValue('222 00 00 00');
    await c.pay();
    expect(c.msisdn.hasError('msisdn')).toBeTrue();
    expect(payments.declare).not.toHaveBeenCalled();
  });

  it('adds the service fee on top of each line', async () => {
    await setup([DIRECT_MTN]);
    payments.feePercent.and.returnValue(of(2));
    fixture.componentInstance.load();
    expect(fixture.componentInstance.feeCents()).toBe(150_000); // 2 % of each line
  });

  it('stops and explains when the operator refuses', async () => {
    await setup([DIRECT_MTN]);
    payments.sync.and.returnValue(of(payment('rejected')));
    const c = fixture.componentInstance;
    c.option.set('enrollment_only');
    c.msisdn.setValue('670000000');
    await c.pay();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(c.error()).toBeTruthy();
    expect(c.submitting()).toBeFalse();
  });

  it('manual mode: shows where to pay, declares the SMS reference and never polls', async () => {
    await setup([MANUAL_ORANGE]);
    const c = fixture.componentInstance;
    expect(c.channel()?.manual).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('123456');
    expect(fixture.nativeElement.textContent).toContain('690000000');

    c.msisdn.setValue('699999999');
    c.reference.setValue('mp 231017.1234');
    await c.pay();

    expect(payments.declare).toHaveBeenCalledTimes(2);
    expect(payments.declare.calls.argsFor(1)).toEqual([
      '3',
      jasmine.objectContaining({ type: 'tuition_installment', installmentNumber: 1 }),
      'orange',
      '699999999',
      'MP231017.1234',
    ]);
    expect(payments.sync).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/parent/confirmation', '3']);
  });

  it('manual mode: a reference is required', async () => {
    await setup([MANUAL_ORANGE]);
    const c = fixture.componentInstance;
    c.msisdn.setValue('699999999');
    c.reference.setValue('abc');
    await c.pay();
    expect(c.reference.hasError('reference')).toBeTrue();
    expect(payments.declare).not.toHaveBeenCalled();
  });

  it('no method configured: tells the parent to call the school', async () => {
    await setup([]);
    fixture.detectChanges();
    expect(schools.getById).toHaveBeenCalledWith('1');
    expect(fixture.componentInstance.schoolPhone()).toBe('233 42 00 00');
    expect(fixture.nativeElement.querySelector('.notice')).not.toBeNull();
  });
});

describe('payment input normalization', () => {
  it('normalizes numbers and references', () => {
    expect(normalizeMsisdn('+237 6 70-00.00.00')).toBe('670000000');
    expect(normalizeMsisdn('00237670000000')).toBe('670000000');
    expect(normalizeReference(' mp 2310 17.a ')).toBe('MP231017.A');
  });
});
