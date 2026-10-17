import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { EnrollmentService } from './enrollment.service';
import { EnrollmentsService } from '../api';

const DTO = {
  id: 3,
  school_class_id: 10,
  academic_year: '2026-2027',
  status: 'active',
  is_returning_student: true,
  requires_documents: false,
  payment_validated: true,
  person: { first_name: 'Ada', last_name: 'Lovelace', gender: 'female' },
  school: { id: 1, name: 'Lycée X' },
  school_class: {
    id: 10,
    education_type: 'professional',
    effective_system: 'anglophone',
    level: { id: 2, label: 'Form 1' },
    specialty: { id: 4, label: 'Electronics' },
    installments: [{ number: 1, amount_cents: 5_000_000, due_date: '2026-11-15' }],
  },
  balance: {
    tuition_total_cents: 15_000_000,
    tuition_paid_cents: 5_000_000,
    tuition_pending_cents: 0,
    tuition_remaining_cents: 10_000_000,
    tuition_settled: false,
    enrollment_fee_cents: 2_500_000,
    enrollment_fee_paid_cents: 2_500_000,
    enrollment_fee_status: 'paid',
  },
  documents: [{ id: 8, filename: 'acte.pdf', content_type: 'application/pdf', size_bytes: 100 }],
  created_at: '2026-09-01T10:00:00Z',
};

describe('EnrollmentService', () => {
  let api: jasmine.SpyObj<EnrollmentsService>;
  let service: EnrollmentService;

  beforeEach(() => {
    api = jasmine.createSpyObj<EnrollmentsService>('EnrollmentsService', [
      'enrollmentsGet',
      'enrollmentsIdGet',
      'enrollmentsIdAcceptPost',
      'enrollmentsIdRejectPost',
      'enrollmentsIdDocumentsDocIdGet',
    ]);
    TestBed.configureTestingModule({ providers: [{ provide: EnrollmentsService, useValue: api }] });
    service = TestBed.inject(EnrollmentService);
  });

  it('sends every filter and maps class, balance and documents', (done) => {
    api.enrollmentsGet.and.returnValue(of({ data: [DTO], meta: { total: 1, limit: 20, offset: 20 } }) as never);
    service
      .getAll({ schoolId: '1', classId: '10', academicYear: '2026-2027', tuitionSettled: false, page: 2, pageSize: 20 })
      .subscribe((page) => {
        expect(api.enrollmentsGet).toHaveBeenCalledWith(1, undefined, undefined, undefined, '2026-2027', 10, false, 20, 20);
        const e = page.data[0];
        expect(e.studentName).toBe('Ada Lovelace');
        expect(e.className).toBe('Form 1 — Electronics');
        expect(e.classSystem).toBe('anglophone');
        expect(e.classEducationType).toBe('vocational');
        expect(e.balance?.tuitionRemaining).toBe(100000);
        expect(e.tuitionInstallments).toEqual([{ number: 1, amount: 50000, dueDate: '2026-11-15' }]);
        expect(e.documentsReceived).toBeTrue();
        expect(e.documents?.[0]).toEqual(jasmine.objectContaining({ id: '8', filename: 'acte.pdf' }));
        done();
      });
  });

  it('defaults an unknown system and type, and an enrollment without balance', (done) => {
    api.enrollmentsIdGet.and.returnValue(of({ data: { id: 4, school_class: { education_type: 'x' } } }) as never);
    service.getById('4').subscribe((e) => {
      expect(e.classSystem).toBe('francophone');
      expect(e.classEducationType).toBe('general');
      expect(e.balance).toBeUndefined();
      expect(e.status).toBe('pending');
      done();
    });
  });

  it('accepts, rejects with the reason and downloads a document', () => {
    api.enrollmentsIdAcceptPost.and.returnValue(of({ data: DTO }) as never);
    api.enrollmentsIdRejectPost.and.returnValue(of({ data: { ...DTO, status: 'rejected' } }) as never);
    api.enrollmentsIdDocumentsDocIdGet.and.returnValue(of(new Blob(['x'])) as never);

    service.accept('3').subscribe();
    expect(api.enrollmentsIdAcceptPost).toHaveBeenCalledWith(3);

    service.reject('3', { reason: 'Dossier incomplet' }).subscribe((e) => expect(e.status).toBe('rejected'));
    expect(api.enrollmentsIdRejectPost).toHaveBeenCalledWith(3, { rejection_reason: 'Dossier incomplet' });

    service.downloadDocument('3', '8').subscribe();
    expect(api.enrollmentsIdDocumentsDocIdGet).toHaveBeenCalledWith(3, 8);
  });
});
