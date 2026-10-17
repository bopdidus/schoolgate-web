import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PaymentService } from './payment.service';
import { PaymentsService } from '../api';

const DTO = {
  id: 7,
  enrollment_id: 3,
  type: 'enrollment_fee',
  amount_cents: 5_000_000,
  status: 'declared',
  payment_method: 'orange',
  manual: true,
  mobile_money_reference: 'MP231017.1234',
  payer_msisdn: '690000000',
  declared_at: '2026-10-17T08:00:00Z',
  validation_deadline: '2026-10-22T08:00:00Z',
  person: { first_name: 'Ada', last_name: 'Lovelace' },
  school: { id: 1, name: 'Lycée X' },
  school_class: { education_type: 'technical', specialty: { id: 4, label: 'Électronique' } },
};

describe('PaymentService', () => {
  let api: jasmine.SpyObj<PaymentsService>;
  let service: PaymentService;

  beforeEach(() => {
    api = jasmine.createSpyObj<PaymentsService>('PaymentsService', ['paymentsGet', 'paymentsIdConfirmPost', 'paymentsIdRejectPost']);
    TestBed.configureTestingModule({ providers: [{ provide: PaymentsService, useValue: api }] });
    service = TestBed.inject(PaymentService);
  });

  it('maps a manual payment and asks only for the manual ones waiting', (done) => {
    api.paymentsGet.and.returnValue(of({ data: [DTO], meta: { total: 1, limit: 10, offset: 0 } }) as never);
    service.getAll({ status: 'declared', manual: true, page: 1, pageSize: 10 }).subscribe((page) => {
      expect(api.paymentsGet).toHaveBeenCalledWith(undefined, 'declared', undefined, undefined, true, 10, 0);
      const p = page.data[0];
      expect(p).toEqual(
        jasmine.objectContaining({
          id: '7',
          amount: 50000,
          manual: true,
          method: 'orange',
          mobileMoneyReference: 'MP231017.1234',
          studentName: 'Ada Lovelace',
          schoolName: 'Lycée X',
          classEducationType: 'technical',
          classSpecialtyLabel: 'Électronique',
        }),
      );
      done();
    });
  });

  it('filters by education type and specialty on the page it got', (done) => {
    api.paymentsGet.and.returnValue(
      of({ data: [DTO, { ...DTO, id: 8, school_class: { education_type: 'general' } }], meta: { total: 2 } }) as never,
    );
    service.getAll({ educationType: 'technical', specialtyId: 'électro' }).subscribe((page) => {
      expect(page.data.map((p) => p.id)).toEqual(['7']);
      expect(page.total).toBe(1);
      done();
    });
  });

  it('confirms and rejects a manual payment with the reason', () => {
    api.paymentsIdConfirmPost.and.returnValue(of({}) as never);
    api.paymentsIdRejectPost.and.returnValue(of({}) as never);

    service.confirm('7').subscribe();
    expect(api.paymentsIdConfirmPost).toHaveBeenCalledWith(7);

    service.reject('7', 'Aucun transfert reçu').subscribe();
    expect(api.paymentsIdRejectPost).toHaveBeenCalledWith(7, { reason: 'Aucun transfert reçu' });
  });
});
