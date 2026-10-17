import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { EnrollmentDetailComponent } from './enrollment-detail.component';
import { provideTestDefaults } from '../../../testing/test-providers';
import { ParentEnrollmentsService } from '../services/parent-enrollments.service';
import { ParentPaymentsService } from '../services/parent-payments.service';
import { ParentInvoicesService } from '../services/parent-invoices.service';
import { NotificationService } from '../../core/services/notification.service';
import { ChecklistItem, ParentEnrollment, ParentPayment } from '../domain/models';

const ENROLLMENT: ParentEnrollment = {
  id: '3',
  status: 'active',
  academicYear: '2026-2027',
  isReturningStudent: false,
  requiresDocuments: true,
  paymentValidated: true,
  createdAt: '2026-09-01',
  schoolId: '1',
  schoolName: 'Lycée X',
  paymentDueAt: new Date(Date.now() + 3 * 86_400_000).toISOString(),
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

const PAID_FEE: ParentPayment = { id: '7', enrollmentId: '3', type: 'enrollment_fee', amountCents: 2_500_000, feeCents: 0, status: 'validated', declaredAt: '2026-09-02' };
const ITEM: ChecklistItem = { documentType: { id: '5', code: 'birth', label: 'Acte' }, purpose: 'enrollment', required: true, satisfied: false };

describe('EnrollmentDetailComponent', () => {
  let fixture: ComponentFixture<EnrollmentDetailComponent>;
  let enrollments: jasmine.SpyObj<ParentEnrollmentsService>;
  let notification: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    enrollments = jasmine.createSpyObj<ParentEnrollmentsService>('ParentEnrollmentsService', ['getById', 'checklist', 'uploadDocuments']);
    enrollments.getById.and.returnValue(of(ENROLLMENT));
    enrollments.checklist.and.returnValue(of([ITEM]));
    enrollments.uploadDocuments.and.returnValue(of(undefined));
    notification = jasmine.createSpyObj<NotificationService>('NotificationService', ['error', 'success', 'warning']);
    await TestBed.configureTestingModule({
      imports: [EnrollmentDetailComponent],
      providers: [
        ...provideTestDefaults(),
        { provide: ParentEnrollmentsService, useValue: enrollments },
        { provide: ParentPaymentsService, useValue: { forEnrollment: () => of([PAID_FEE]) } },
        {
          provide: ParentInvoicesService,
          useValue: {
            forEnrollment: () =>
              of([
                { id: 'inv-1', paymentId: '7', amountCents: 2_500_000, issuedAt: '', paymentType: 'enrollment_fee' },
                { id: 'inv-other', paymentId: '99', amountCents: 1, issuedAt: '', paymentType: 'enrollment_fee' },
              ]),
          },
        },
        { provide: NotificationService, useValue: notification },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(EnrollmentDetailComponent);
    fixture.componentRef.setInput('id', '3');
    fixture.detectChanges();
  });

  it('shows the fee settled, the tuition still due and lets the parent pay', () => {
    const c = fixture.componentInstance;
    expect(c.fee()?.settled).toBeTrue();
    expect(c.tuition()).not.toBeNull();
    expect(c.canPay()).toBeTrue();
    expect(c.paymentDaysLeft()).toBe(3);
  });

  it('keeps only the invoices of this enrollment', () => {
    expect(fixture.componentInstance.invoices().map((i) => i.id)).toEqual(['inv-1']);
  });

  it('uploads a missing document and reloads the checklist', () => {
    const input = document.createElement('input');
    const file = new File(['%PDF'], 'acte.pdf', { type: 'application/pdf' });
    Object.defineProperty(input, 'files', { value: [file] });
    fixture.componentInstance.onFiles({ target: input } as unknown as Event, ITEM);
    expect(enrollments.uploadDocuments).toHaveBeenCalledWith('3', [file], '5');
    expect(notification.success).toHaveBeenCalledWith('PARENT.DOCUMENT_UPLOADED');
    expect(enrollments.checklist).toHaveBeenCalledTimes(2);
  });

  it('shows the code of an automatic rejection, else the school text', () => {
    const c = fixture.componentInstance;
    expect(c.rejectionText({ ...ENROLLMENT, rejectionReason: 'Classe pleine' })).toBe('Classe pleine');
    expect(c.paymentLabel(PAID_FEE)).toBe('PARENT.ENROLLMENT_FEE');
  });
});
