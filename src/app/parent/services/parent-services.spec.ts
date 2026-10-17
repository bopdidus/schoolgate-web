import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { EnrollmentsService, InvoicesService, PaymentsService, PersonsService, ReferenceService, SchoolsService } from '../../api';
import { ParentEnrollmentsService } from './parent-enrollments.service';
import { ParentInvoicesService } from './parent-invoices.service';
import { ParentPaymentsService } from './parent-payments.service';
import { ParentSchoolsService } from './parent-schools.service';

describe('Parent services', () => {
  let enrollments: jasmine.SpyObj<EnrollmentsService>;
  let persons: jasmine.SpyObj<PersonsService>;
  let payments: jasmine.SpyObj<PaymentsService>;
  let schools: jasmine.SpyObj<SchoolsService>;
  let reference: jasmine.SpyObj<ReferenceService>;
  let invoices: jasmine.SpyObj<InvoicesService>;

  beforeEach(() => {
    enrollments = jasmine.createSpyObj<EnrollmentsService>('EnrollmentsService', [
      'enrollmentsGet',
      'enrollmentsIdGet',
      'enrollmentsPost',
      'enrollmentsIdDocumentsPost',
      'enrollmentsIdDocumentsChecklistGet',
    ]);
    persons = jasmine.createSpyObj<PersonsService>('PersonsService', ['personsGet']);
    payments = jasmine.createSpyObj<PaymentsService>('PaymentsService', [
      'enrollmentsIdPaymentsGet',
      'paymentsFeePolicyGet',
      'paymentsPost',
      'paymentsIdSyncStatusPost',
    ]);
    schools = jasmine.createSpyObj<SchoolsService>('SchoolsService', [
      'schoolsGet',
      'schoolsIdGet',
      'schoolsIdDocumentRequirementsGet',
      'schoolsIdPaymentMethodsGet',
    ]);
    reference = jasmine.createSpyObj<ReferenceService>('ReferenceService', ['referenceLevelsGet']);
    invoices = jasmine.createSpyObj<InvoicesService>('InvoicesService', ['invoicesGet']);
    TestBed.configureTestingModule({
      providers: [
        { provide: EnrollmentsService, useValue: enrollments },
        { provide: PersonsService, useValue: persons },
        { provide: PaymentsService, useValue: payments },
        { provide: SchoolsService, useValue: schools },
        { provide: ReferenceService, useValue: reference },
        { provide: InvoicesService, useValue: invoices },
      ],
    });
  });

  describe('ParentSchoolsService', () => {
    it('reads how each channel is collected and where to pay by hand', (done) => {
      schools.schoolsIdPaymentMethodsGet.and.returnValue(
        of({
          data: {
            methods: ['mtn', 'orange'],
            channels: [
              { method: 'mtn', mode: 'direct' },
              { method: 'orange', mode: 'manual', number: '690000000', account_name: 'Lycée X', merchant_code: '123456' },
            ],
          },
        }) as never,
      );
      TestBed.inject(ParentSchoolsService)
        .paymentMethods('3')
        .subscribe((channels) => {
          expect(channels).toEqual([
            { method: 'mtn', manual: false, number: '', accountName: '', merchantCode: '' },
            { method: 'orange', manual: true, number: '690000000', accountName: 'Lycée X', merchantCode: '123456' },
          ]);
          done();
        });
    });

    it('offers nothing when no channel is listed', (done) => {
      schools.schoolsIdPaymentMethodsGet.and.returnValue(of({ data: { methods: [] } }) as never);
      TestBed.inject(ParentSchoolsService)
        .paymentMethods('3')
        .subscribe((channels) => {
          expect(channels).toEqual([]);
          done();
        });
    });

    it('searches schools with the filters and keeps one level per code', () => {
      schools.schoolsGet.and.returnValue(of({ data: [{ id: 3, name: 'Lycée X' }], meta: { total: 30 } }) as never);
      reference.referenceLevelsGet.and.returnValue(
        of({ data: [{ id: 1, code: '6E', label: '6ème' }, { id: 2, code: '6E', label: 'Sixième' }, { id: 9, code: 'other', label: 'Autre' }] }) as never,
      );
      const service = TestBed.inject(ParentSchoolsService);
      service.search({ q: ' lycée ', cityId: 4, system: 'francophone', page: 2 }).subscribe((page) => {
        expect(page.total).toBe(30);
        expect(page.items[0].name).toBe('Lycée X');
      });
      expect(schools.schoolsGet).toHaveBeenCalledWith('lycée', undefined, 4, undefined, 'francophone', 12, 12);
      service.levels().subscribe((levels) => expect(levels).toEqual([{ id: '1', code: '6E', label: '6ème' }]));
    });
  });

  describe('ParentEnrollmentsService', () => {
    it('creates a request for a new child then reloads it whole', (done) => {
      enrollments.enrollmentsPost.and.returnValue(of({ data: { id: 12 } }) as never);
      enrollments.enrollmentsIdGet.and.returnValue(of({ data: { id: 12, status: 'pending' } }) as never);
      TestBed.inject(ParentEnrollmentsService)
        .create({ classId: '10', isReturningStudent: false, newChild: { firstName: ' Ada ', lastName: 'L', gender: 'female' }, matricule: 'X1' })
        .subscribe((e) => {
          expect(enrollments.enrollmentsPost).toHaveBeenCalledWith(
            jasmine.objectContaining({
              school_class_id: 10,
              is_returning_student: false,
              student_first_name: 'Ada',
              student_gender: 'female',
              matricule: undefined,
            }),
          );
          expect(enrollments.enrollmentsIdGet).toHaveBeenCalledWith(12);
          expect(e.id).toBe('12');
          done();
        });
    });

    it('lists, finds a student and loads children and the checklist', () => {
      enrollments.enrollmentsGet.and.returnValue(of({ data: [{ id: 1 }] }) as never);
      persons.personsGet.and.returnValue(of({ data: [{ id: 5, first_name: 'Ada', last_name: 'L' }] }) as never);
      enrollments.enrollmentsIdDocumentsChecklistGet.and.returnValue(of({ data: [{ purpose: 'enrollment', required: true, satisfied: false }] }) as never);
      enrollments.enrollmentsIdDocumentsPost.and.returnValue(of({}) as never);
      const service = TestBed.inject(ParentEnrollmentsService);

      service.list('2026-2027').subscribe((list) => expect(list.length).toBe(1));
      expect(enrollments.enrollmentsGet).toHaveBeenCalledWith(undefined, undefined, undefined, undefined, '2026-2027', undefined, undefined, 100, 0);
      service.findStudent(' LX-001 ').subscribe();
      expect(enrollments.enrollmentsGet).toHaveBeenCalledWith(undefined, undefined, 'LX-001', undefined, undefined, undefined, undefined, 20, 0);
      service.children().subscribe((children) => expect(children[0].firstName).toBe('Ada'));
      service.checklist('1').subscribe((items) => expect(items.length).toBe(1));
      const file = new File(['%PDF'], 'acte.pdf');
      service.uploadDocuments('1', [file], '5').subscribe();
      expect(enrollments.enrollmentsIdDocumentsPost).toHaveBeenCalledWith(1, [file], 5);
    });
  });

  describe('ParentPaymentsService', () => {
    it('declares a manual payment with its reference', () => {
      payments.paymentsPost.and.returnValue(of({ data: { payment: { id: 7, status: 'declared', manual: true } } }) as never);
      TestBed.inject(ParentPaymentsService)
        .declare('3', { type: 'enrollment_fee', amountCents: 5_000_000 }, 'orange', '690000000', 'MP231017.1234')
        .subscribe((p) => expect(p.manual).toBeTrue());
      expect(payments.paymentsPost).toHaveBeenCalledWith(
        jasmine.objectContaining({ enrollment_id: 3, payment_method: 'orange', transaction_reference: 'MP231017.1234' }),
      );
    });

    it('reads the fee, the payments and syncs one', () => {
      payments.paymentsFeePolicyGet.and.returnValue(of({ data: { percent: 2 } }) as never);
      payments.enrollmentsIdPaymentsGet.and.returnValue(of({ data: [{ id: 1, status: 'validated', amount_cents: 100 }] }) as never);
      payments.paymentsIdSyncStatusPost.and.returnValue(of({ data: { payment: { id: 1, status: 'validated' } } }) as never);
      const service = TestBed.inject(ParentPaymentsService);
      service.feePercent().subscribe((p) => expect(p).toBe(2));
      service.forEnrollment('3').subscribe((list) => expect(list[0].amountCents).toBe(100));
      service.sync('1').subscribe((p) => expect(p.status).toBe('validated'));
    });
  });

  it('lists the invoices of one enrollment', () => {
    invoices.invoicesGet.and.returnValue(of({ data: [{ id: 'inv-1', payment_id: 7, amount_cents: 100, payment_type: 'enrollment_fee' }] }) as never);
    TestBed.inject(ParentInvoicesService)
      .forEnrollment('3')
      .subscribe((list) => expect(list[0]).toEqual(jasmine.objectContaining({ id: 'inv-1', paymentId: '7', amountCents: 100 })));
    expect(invoices.invoicesGet).toHaveBeenCalledWith(3, 100, 0);
  });
});
