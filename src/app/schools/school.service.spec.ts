import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { SchoolService } from './school.service';
import { SchoolsService } from '../api';
import { PaymentSettingsUpdate } from './school.model';

describe('SchoolService', () => {
  let api: jasmine.SpyObj<SchoolsService>;
  let service: SchoolService;

  beforeEach(() => {
    api = jasmine.createSpyObj<SchoolsService>('SchoolsService', [
      'schoolsGet',
      'schoolsIdGet',
      'schoolsIdValidatePost',
      'schoolsIdDelete',
      'schoolsIdSchoolClassesSchoolClassIdDelete',
      'schoolsIdDocumentRequirementsGet',
      'schoolsIdDocumentRequirementsPut',
      'schoolsIdPaymentSettingsGet',
      'schoolsIdPaymentSettingsPut',
      'schoolsIdPaymentChannelsGet',
      'schoolsIdPaymentChannelsMethodSubmitPost',
      'schoolsIdPaymentChannelsMethodReviewPost',
      'schoolsIdPaymentChannelsMethodTestPost',
      'paymentChannelReviewsGet',
      'schoolsIdKycDocumentsGet',
      'schoolsIdKycDocumentsPost',
      'schoolsIdKycDocumentsDocIdDelete',
    ]);
    TestBed.configureTestingModule({ providers: [{ provide: SchoolsService, useValue: api }] });
    service = TestBed.inject(SchoolService);
  });

  it('lists schools with the search and status filters', (done) => {
    api.schoolsGet.and.returnValue(
      of({
        data: [{ id: 3, name: 'Lycée X', city: { id: 2, name: 'Douala' }, phone: '233 42 00 00', status: 'pending', system: 'bilingual' }],
        meta: { total: 1 },
      }) as never,
    );
    service.getAll({ search: 'lyc', status: 'pending', page: 1, pageSize: 10 }).subscribe((page) => {
      expect(api.schoolsGet).toHaveBeenCalledWith('lyc', 'pending', undefined, undefined, undefined, 10, 0);
      expect(page.data[0]).toEqual(
        jasmine.objectContaining({ id: '3', city: 'Douala', cityId: 2, phone: '233 42 00 00', status: 'pending', schoolSystem: 'bilingual' }),
      );
      done();
    });
  });

  it('maps and sends the payment settings with the collection mode', (done) => {
    api.schoolsIdPaymentSettingsGet.and.returnValue(
      of({ data: { orange_money_enabled: true, orange_mode: 'manual', orange_merchant_code: '123456', mtn_mode: 'bogus' } }) as never,
    );
    service.getPaymentSettings('3').subscribe((s) => {
      expect(s.orangeMode).toBe('manual');
      expect(s.orangeMerchantCode).toBe('123456');
      expect(s.mtnMode).toBe('direct');
      done();
    });

    api.schoolsIdPaymentSettingsPut.and.returnValue(of({ data: {} }) as never);
    service.setPaymentSettings('3', { orangeMoneyEnabled: true, orangeMode: 'manual', orangeMerchantCode: '123456', mtnMode: 'direct' } as PaymentSettingsUpdate).subscribe();
    expect(api.schoolsIdPaymentSettingsPut).toHaveBeenCalledWith(
      3,
      jasmine.objectContaining({ orange_money_enabled: true, orange_mode: 'manual', orange_merchant_code: '123456', mtn_mode: 'direct' }),
    );
  });

  it('maps channels, the review queue and the activation calls', () => {
    const channel = { method: 'orange', mode: 'manual', status: 'submitted', missing_documents: ['rccm'], test_amount_cents: 10_000 };
    api.schoolsIdPaymentChannelsGet.and.returnValue(of({ data: { channels: [channel] } }) as never);
    api.paymentChannelReviewsGet.and.returnValue(of({ data: { reviews: [{ ...channel, school_id: 3, school_name: 'Lycée X' }] } }) as never);
    api.schoolsIdPaymentChannelsMethodSubmitPost.and.returnValue(of({ data: channel }) as never);
    api.schoolsIdPaymentChannelsMethodReviewPost.and.returnValue(of({ data: { ...channel, status: 'active' } }) as never);
    api.schoolsIdPaymentChannelsMethodTestPost.and.returnValue(of({ data: channel }) as never);

    service.getPaymentChannels('3').subscribe(([c]) => {
      expect(c).toEqual(jasmine.objectContaining({ method: 'orange', mode: 'manual', status: 'submitted', missingDocuments: ['rccm'], testAmount: 100 }));
    });
    service.getPaymentChannelReviews('submitted').subscribe(([r]) => expect(r).toEqual(jasmine.objectContaining({ schoolId: '3', schoolName: 'Lycée X' })));
    service.submitPaymentChannel('3', 'orange').subscribe();
    expect(api.schoolsIdPaymentChannelsMethodSubmitPost).toHaveBeenCalledWith(3, 'orange');
    service.reviewPaymentChannel('3', 'orange', 'approve').subscribe((c) => expect(c.status).toBe('active'));
    expect(api.schoolsIdPaymentChannelsMethodReviewPost).toHaveBeenCalledWith(3, 'orange', { action: 'approve', note: '' });
    service.startPaymentChannelTest('3', 'mtn', '670000000').subscribe();
    expect(api.schoolsIdPaymentChannelsMethodTestPost).toHaveBeenCalledWith(3, 'mtn', { payer_msisdn: '670000000' });
  });

  it('handles the KYC documents', () => {
    api.schoolsIdKycDocumentsGet.and.returnValue(of({ data: { documents: [{ id: 5, type: 'niu', filename: 'niu.pdf', status: 'approved' }] } }) as never);
    api.schoolsIdKycDocumentsPost.and.returnValue(of({ data: { id: 6, type: 'rccm', status: 'pending' } }) as never);
    api.schoolsIdKycDocumentsDocIdDelete.and.returnValue(of({}) as never);
    const file = new File(['%PDF'], 'rccm.pdf');

    service.getKycDocuments('3').subscribe(([d]) => expect(d).toEqual(jasmine.objectContaining({ id: '5', type: 'niu', status: 'approved' })));
    service.uploadKycDocument('3', 'rccm', file).subscribe((d) => expect(d.status).toBe('pending'));
    expect(api.schoolsIdKycDocumentsPost).toHaveBeenCalledWith(3, file, 'rccm');
    service.deleteKycDocument('3', '6').subscribe();
    expect(api.schoolsIdKycDocumentsDocIdDelete).toHaveBeenCalledWith(3, 6);
  });

  it('reads and replaces the required documents', () => {
    api.schoolsIdDocumentRequirementsGet.and.returnValue(
      of({ data: [{ id: 1, document_type: { id: 7, label: 'Acte' }, purpose: 'enrollment', required: true }] }) as never,
    );
    api.schoolsIdDocumentRequirementsPut.and.returnValue(of({ data: [] }) as never);
    service.getDocumentRequirements('3').subscribe(([r]) => expect(r).toEqual(jasmine.objectContaining({ documentTypeId: '7', documentTypeLabel: 'Acte', required: true })));
    service.setDocumentRequirements('3', [{ documentTypeId: '7', purpose: 'tuition_payment', required: false, otherLabel: 'Photo' }]).subscribe();
    expect(api.schoolsIdDocumentRequirementsPut).toHaveBeenCalledWith(3, {
      requirements: [{ document_type_id: 7, purpose: 'tuition_payment', required: false, other_label: 'Photo' }],
    } as never);
  });

  it('validates, deletes a school and a class', () => {
    api.schoolsIdValidatePost.and.returnValue(of({ data: { id: 3, status: 'active' } }) as never);
    api.schoolsIdDelete.and.returnValue(of({}) as never);
    api.schoolsIdSchoolClassesSchoolClassIdDelete.and.returnValue(of({}) as never);
    service.validate('3').subscribe((s) => expect(s.status).toBe('active'));
    service.delete('3').subscribe();
    service.deleteClass('3', '10').subscribe();
    expect(api.schoolsIdSchoolClassesSchoolClassIdDelete).toHaveBeenCalledWith(3, 10);
  });
});
