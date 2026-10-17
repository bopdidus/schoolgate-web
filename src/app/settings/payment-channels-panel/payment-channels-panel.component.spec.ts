import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PaymentChannelsPanelComponent } from './payment-channels-panel.component';
import { provideTestDefaults } from '../../../testing/test-providers';
import { SchoolService } from '../../schools/school.service';
import { AbilityService } from '../../core/services/ability.service';
import { PaymentChannel } from '../../schools/school.model';

const DRAFT: PaymentChannel = {
  method: 'orange',
  mode: 'direct',
  status: 'draft',
  detailsComplete: true,
  requiredDocuments: ['rccm', 'niu'],
  missingDocuments: [],
  submittedAt: null,
  reviewedAt: null,
  reviewNote: '',
  testStatus: null,
  testPayerMsisdn: '',
  testAmount: 100,
  activatedAt: null,
};

describe('PaymentChannelsPanelComponent', () => {
  let fixture: ComponentFixture<PaymentChannelsPanelComponent>;
  let schoolService: jasmine.SpyObj<SchoolService>;

  /** role: what AbilityService answers for the school scope and for the unscoped admin rule. */
  async function setup(channels: PaymentChannel[], role: 'school_admin' | 'editor' | 'admin'): Promise<void> {
    schoolService = jasmine.createSpyObj<SchoolService>('SchoolService', [
      'getPaymentChannels',
      'getKycDocuments',
      'submitPaymentChannel',
      'reviewPaymentChannel',
      'startPaymentChannelTest',
      'syncPaymentChannelTest',
    ]);
    schoolService.getPaymentChannels.and.returnValue(of(channels));
    schoolService.getKycDocuments.and.returnValue(of([]));
    schoolService.submitPaymentChannel.and.returnValue(of({ ...DRAFT, status: 'submitted' }));
    schoolService.reviewPaymentChannel.and.returnValue(of({ ...DRAFT, status: 'approved' }));
    schoolService.startPaymentChannelTest.and.returnValue(of({ ...DRAFT, status: 'approved', testStatus: 'failed' }));

    const can = (_action: string, _subject: string, scope?: unknown): boolean =>
      role === 'admin' || (role === 'school_admin' && scope !== undefined);

    await TestBed.configureTestingModule({
      imports: [PaymentChannelsPanelComponent],
      providers: [
        ...provideTestDefaults(),
        { provide: SchoolService, useValue: schoolService },
        { provide: AbilityService, useValue: { can } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentChannelsPanelComponent);
    fixture.componentRef.setInput('schoolId', '1');
    fixture.detectChanges();
  }

  const buttons = (): HTMLButtonElement[] => Array.from(fixture.nativeElement.querySelectorAll('button'));
  const buttonWith = (key: string): HTMLButtonElement | undefined =>
    buttons().find((b) => b.textContent?.includes(key));

  it('lets the school admin submit a complete draft', async () => {
    await setup([DRAFT], 'school_admin');
    const submit = buttonWith('PAYMENT_CHANNELS.SUBMIT')!;
    expect(submit.disabled).toBeFalse();
    submit.click();
    expect(schoolService.submitPaymentChannel).toHaveBeenCalledWith('1', 'orange');
    expect(fixture.componentInstance.channels()[0].status).toBe('submitted');
  });

  it('blocks submission while a document is missing', async () => {
    await setup([{ ...DRAFT, missingDocuments: ['niu'] }], 'school_admin');
    expect(buttonWith('PAYMENT_CHANNELS.SUBMIT')!.disabled).toBeTrue();
  });

  it('never loads the legal documents for an editor', async () => {
    await setup([DRAFT], 'editor');
    expect(schoolService.getKycDocuments).not.toHaveBeenCalled();
    expect(buttonWith('PAYMENT_CHANNELS.SUBMIT')).toBeUndefined();
  });

  it('shows the admin decision on a submitted channel and requires a note to reject', async () => {
    await setup([{ ...DRAFT, status: 'submitted' }], 'admin');
    buttonWith('PAYMENT_CHANNELS.REJECT')!.click();
    expect(schoolService.reviewPaymentChannel).not.toHaveBeenCalled();

    buttonWith('PAYMENT_CHANNELS.APPROVE')!.click();
    expect(schoolService.reviewPaymentChannel).toHaveBeenCalledWith('1', 'orange', 'approve', '');
  });

  it('starts the test payment from a normalized phone', async () => {
    await setup([{ ...DRAFT, status: 'approved' }], 'school_admin');
    fixture.componentInstance.testPhone.orange = '+237 677 00 00 00';
    fixture.componentInstance.startTest('orange');
    expect(schoolService.startPaymentChannelTest).toHaveBeenCalledWith('1', 'orange', '677000000');
  });
});
