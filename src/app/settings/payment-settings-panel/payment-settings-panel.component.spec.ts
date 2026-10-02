import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { normalizeCameroonMobile, PaymentSettingsPanelComponent } from './payment-settings-panel.component';
import { provideTestDefaults } from '../../../testing/test-providers';
import { SchoolService } from '../../schools/school.service';
import { AbilityService } from '../../core/services/ability.service';
import { PaymentSettings, PaymentSettingsUpdate } from '../../schools/school.model';

const EMPTY: PaymentSettings = {
  orangeMoneyEnabled: false,
  orangeMoneyNumber: '',
  orangeMoneyAccountName: '',
  orangeClientId: '',
  orangeSecretsSet: false,
  mtnMomoEnabled: false,
  mtnMomoNumber: '',
  mtnMomoAccountName: '',
  mtnApiUser: '',
  mtnSecretsSet: false,
  paypalEnabled: false,
  paypalEmail: '',
  bankTransferEnabled: false,
  bankName: '',
  bankAccountHolder: '',
  bankAccountNumber: '',
  bankSwiftCode: '',
};

const EMPTY_UPDATE: PaymentSettingsUpdate = {
  orangeMoneyEnabled: false,
  orangeMoneyNumber: '',
  orangeMoneyAccountName: '',
  orangeClientId: '',
  orangeClientSecret: '',
  orangeAuthToken: '',
  orangePin: '',
  mtnMomoEnabled: false,
  mtnMomoNumber: '',
  mtnMomoAccountName: '',
  mtnApiUser: '',
  mtnApiKey: '',
  mtnSubscriptionKey: '',
  paypalEnabled: false,
  paypalEmail: '',
  bankTransferEnabled: false,
  bankName: '',
  bankAccountHolder: '',
  bankAccountNumber: '',
  bankSwiftCode: '',
};

describe('PaymentSettingsPanelComponent', () => {
  let fixture: ComponentFixture<PaymentSettingsPanelComponent>;
  let schoolService: jasmine.SpyObj<SchoolService>;

  async function setup(canManage: boolean, settings: PaymentSettings = EMPTY): Promise<void> {
    schoolService = jasmine.createSpyObj<SchoolService>('SchoolService', ['getPaymentSettings', 'setPaymentSettings']);
    schoolService.getPaymentSettings.and.returnValue(of(settings));
    schoolService.setPaymentSettings.and.returnValue(of(settings));

    await TestBed.configureTestingModule({
      imports: [PaymentSettingsPanelComponent],
      providers: [
        ...provideTestDefaults(),
        { provide: SchoolService, useValue: schoolService },
        { provide: AbilityService, useValue: { can: () => canManage } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentSettingsPanelComponent);
    fixture.componentRef.setInput('schoolId', '1');
    fixture.detectChanges();
  }

  it('loads the school settings into the form, secrets left empty', async () => {
    await setup(true, {
      ...EMPTY,
      orangeMoneyEnabled: true,
      orangeMoneyNumber: '690000000',
      orangeMoneyAccountName: 'Lycée X',
      orangeClientId: 'client',
      orangeSecretsSet: true,
    });

    expect(schoolService.getPaymentSettings).toHaveBeenCalledWith('1');
    expect(fixture.componentInstance.form.controls.orange.getRawValue()).toEqual({
      enabled: true,
      secretsSet: true,
      number: '690000000',
      accountName: 'Lycée X',
      clientId: 'client',
      clientSecret: '',
      authToken: '',
      pin: '',
    });
  });

  it('requires the details of a channel only once it is switched on', async () => {
    await setup(true);
    const { form } = fixture.componentInstance;
    expect(form.valid).toBeTrue();

    form.controls.bank.controls.enabled.setValue(true);
    expect(form.controls.bank.controls.accountNumber.hasError('required')).toBeTrue();
    expect(form.valid).toBeFalse();

    form.controls.bank.controls.enabled.setValue(false);
    expect(form.valid).toBeTrue();
  });

  it('requires the merchant secrets until they are saved', async () => {
    await setup(true);
    const mtn = fixture.componentInstance.form.controls.mtn;
    mtn.patchValue({ enabled: true, number: '670000000', accountName: 'Lycée X', apiUser: 'user' });
    expect(mtn.controls.apiKey.hasError('required')).toBeTrue();
    expect(mtn.valid).toBeFalse();

    mtn.patchValue({ apiKey: 'key', subscriptionKey: 'sub' });
    expect(mtn.valid).toBeTrue();
  });

  it('lets saved secrets stay blank (empty keeps them)', async () => {
    await setup(true, {
      ...EMPTY,
      mtnMomoEnabled: true,
      mtnMomoNumber: '670000000',
      mtnMomoAccountName: 'Lycée X',
      mtnApiUser: 'user',
      mtnSecretsSet: true,
    });
    const mtn = fixture.componentInstance.form.controls.mtn;
    expect(mtn.controls.apiKey.value).toBe('');
    expect(mtn.valid).toBeTrue();
  });

  it('checks the Orange PIN format', async () => {
    await setup(true);
    const pin = fixture.componentInstance.form.controls.orange.controls.pin;
    pin.setValue('12ab');
    expect(pin.hasError('pattern')).toBeTrue();
    pin.setValue('1234');
    expect(pin.valid).toBeTrue();
  });

  it('rejects a number that is not a Cameroon mobile', async () => {
    await setup(true);
    const number = fixture.componentInstance.form.controls.mtn.controls.number;
    number.setValue('222 00 00 00');
    expect(number.hasError('mobile')).toBeTrue();
    number.setValue('+237 670 00 00 00');
    expect(number.valid).toBeTrue();
  });

  it('sends every channel and the typed secrets on save', async () => {
    await setup(true);
    const { form } = fixture.componentInstance;
    form.controls.paypal.setValue({ enabled: true, email: 'pay@lycee.cm' });
    form.controls.orange.patchValue({
      enabled: true,
      number: '690000000',
      accountName: 'Lycée X',
      clientId: 'client',
      clientSecret: 'secret',
      authToken: 'auth',
      pin: '1234',
    });
    form.markAsDirty();

    fixture.componentInstance.save();

    expect(schoolService.setPaymentSettings).toHaveBeenCalledWith('1', {
      ...EMPTY_UPDATE,
      paypalEnabled: true,
      paypalEmail: 'pay@lycee.cm',
      orangeMoneyEnabled: true,
      orangeMoneyNumber: '690000000',
      orangeMoneyAccountName: 'Lycée X',
      orangeClientId: 'client',
      orangeClientSecret: 'secret',
      orangeAuthToken: 'auth',
      orangePin: '1234',
    });
  });

  it('does not save an invalid form', async () => {
    await setup(true);
    fixture.componentInstance.form.controls.orange.controls.enabled.setValue(true);

    fixture.componentInstance.save();

    expect(schoolService.setPaymentSettings).not.toHaveBeenCalled();
  });

  it('is read-only for staff who cannot manage the school', async () => {
    await setup(false, { ...EMPTY, paypalEnabled: true, paypalEmail: 'pay@lycee.cm' });

    expect(fixture.componentInstance.form.disabled).toBeTrue();
    expect(fixture.nativeElement.querySelector('button[mat-flat-button]')).toBeNull();
  });
});

describe('normalizeCameroonMobile', () => {
  it('strips the country code, spaces and separators', () => {
    expect(normalizeCameroonMobile('+237 6 90 00 00 00')).toBe('690000000');
    expect(normalizeCameroonMobile('00237-677.12.34.56')).toBe('677123456');
    expect(normalizeCameroonMobile('690000000')).toBe('690000000');
  });
});
