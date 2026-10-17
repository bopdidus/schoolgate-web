import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { InvoiceService } from './invoice.service';
import { InvoicesService } from '../api';

describe('InvoiceService', () => {
  let api: jasmine.SpyObj<InvoicesService>;
  let service: InvoiceService;

  beforeEach(() => {
    api = jasmine.createSpyObj<InvoicesService>('InvoicesService', ['invoicesGet', 'invoicesIdGet', 'invoicesIdVerifyGet']);
    TestBed.configureTestingModule({ providers: [{ provide: InvoicesService, useValue: api }] });
    service = TestBed.inject(InvoiceService);
  });

  it('lists the invoices of one enrollment and maps them', (done) => {
    api.invoicesGet.and.returnValue(
      of({
        data: [{ id: 'inv-1', school_name: 'Lycée X', school_class_name: '6ème', amount_cents: 5_000_000, signature_hash: 'h', issued_at: '2026-10-17' }],
        meta: { total: 11, limit: 10, offset: 10 },
      }) as never,
    );
    service.listForEnrollment('3', 2, 10).subscribe((page) => {
      expect(api.invoicesGet).toHaveBeenCalledWith(3, 10, 10);
      expect(page.total).toBe(11);
      expect(page.data[0]).toEqual(
        jasmine.objectContaining({ id: 'inv-1', uuid: 'inv-1', schoolName: 'Lycée X', amount: 50000, signatureHash: 'h' }),
      );
      done();
    });
  });

  it('reports a genuine and a forged invoice', () => {
    api.invoicesIdVerifyGet.and.returnValues(of({ data: { valid: true } }) as never, of({ data: { valid: false } }) as never);
    service.verify('inv-1').subscribe((v) => expect(v.valid).toBeTrue());
    service.verify('inv-2').subscribe((v) => expect(v).toEqual({ valid: false, message: 'Invalid' }));
  });

  it('loads one invoice', () => {
    api.invoicesIdGet.and.returnValue(of({ data: { id: 'inv-1', amount_cents: 100 } }) as never);
    service.getById('inv-1').subscribe((inv) => expect(inv.amount).toBe(1));
    expect(api.invoicesIdGet).toHaveBeenCalledWith('inv-1');
  });
});
