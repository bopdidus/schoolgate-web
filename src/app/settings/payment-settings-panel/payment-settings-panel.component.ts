import { Component, inject, input, OnInit, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';
import { SchoolService } from '../../schools/school.service';
import { PaymentSettings } from '../../schools/school.model';
import { NotificationService } from '../../core/services/notification.service';
import { AbilityService } from '../../core/services/ability.service';

/** Same normalization as the API: drop spaces/dashes/dots and the +237 prefix. */
export function normalizeCameroonMobile(raw: string): string {
  let s = raw.trim().replace(/[\s.-]/g, '').replace(/^\+/, '').replace(/^00/, '');
  if (s.length === 12 && s.startsWith('237')) s = s.slice(3);
  return s;
}

const normalizeBankAccount = (raw: string): string => raw.replace(/[\s-]/g, '').toUpperCase();

/** A field of a channel is required only while that channel is switched on. */
const requiredWhenEnabled: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  control.parent?.get('enabled')?.value && !String(control.value ?? '').trim() ? { required: true } : null;

/**
 * A secret is required for an enabled channel only until one is saved: the
 * API never sends it back, so an empty field then means "keep the saved one".
 */
const requiredSecretWhenEnabled: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  control.parent?.get('enabled')?.value && !control.parent?.get('secretsSet')?.value && !String(control.value ?? '').trim()
    ? { required: true }
    : null;

const cameroonMobile: ValidatorFn = (control) =>
  !control.value || /^6\d{8}$/.test(normalizeCameroonMobile(control.value)) ? null : { mobile: true };

const bankAccount: ValidatorFn = (control) =>
  !control.value || /^[A-Z0-9]{10,34}$/.test(normalizeBankAccount(control.value)) ? null : { bankAccount: true };

const swiftCode: ValidatorFn = (control) =>
  !control.value || /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(control.value.trim().toUpperCase())
    ? null
    : { swift: true };

@Component({
  selector: 'app-payment-settings-panel',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDividerModule,
    TranslateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment-settings-panel.component.html',
  styleUrl: './payment-settings-panel.component.scss',
})
export class PaymentSettingsPanelComponent implements OnInit {
  readonly schoolId = input.required<string>();

  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly schoolService = inject(SchoolService);
  private readonly notification = inject(NotificationService);
  private readonly abilities = inject(AbilityService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  /** Secret fields currently shown in clear text (by control name). */
  readonly visibleSecrets = signal<ReadonlySet<string>>(new Set());

  readonly form = this.fb.nonNullable.group({
    // secretsSet mirrors the API flag (never sent back): it only relaxes the
    // secret validators once secrets are stored.
    orange: this.fb.nonNullable.group({
      enabled: false,
      secretsSet: false,
      number: ['', [requiredWhenEnabled, cameroonMobile]],
      accountName: ['', [requiredWhenEnabled, Validators.maxLength(150)]],
      clientId: ['', [requiredWhenEnabled, Validators.maxLength(255)]],
      clientSecret: ['', [requiredSecretWhenEnabled, Validators.maxLength(500)]],
      authToken: ['', [requiredSecretWhenEnabled, Validators.maxLength(500)]],
      pin: ['', [requiredSecretWhenEnabled, Validators.pattern(/^\d{4,8}$/)]],
    }),
    mtn: this.fb.nonNullable.group({
      enabled: false,
      secretsSet: false,
      number: ['', [requiredWhenEnabled, cameroonMobile]],
      accountName: ['', [requiredWhenEnabled, Validators.maxLength(150)]],
      apiUser: ['', [requiredWhenEnabled, Validators.maxLength(64)]],
      apiKey: ['', [requiredSecretWhenEnabled, Validators.maxLength(500)]],
      subscriptionKey: ['', [requiredSecretWhenEnabled, Validators.maxLength(500)]],
    }),
    paypal: this.fb.nonNullable.group({
      enabled: false,
      email: ['', [requiredWhenEnabled, Validators.email, Validators.maxLength(255)]],
    }),
    bank: this.fb.nonNullable.group({
      enabled: false,
      name: ['', [requiredWhenEnabled, Validators.maxLength(150)]],
      holder: ['', [requiredWhenEnabled, Validators.maxLength(150)]],
      accountNumber: ['', [requiredWhenEnabled, bankAccount]],
      swiftCode: ['', swiftCode],
    }),
  });

  ngOnInit(): void {
    // Switching a channel on or off changes which of its fields are required.
    for (const group of Object.values(this.form.controls) as FormGroup[]) {
      group.get('enabled')!.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        for (const [name, control] of Object.entries(group.controls)) {
          if (name !== 'enabled') control.updateValueAndValidity({ emitEvent: false });
        }
      });
    }

    if (!this.canManage()) this.form.disable();

    this.schoolService.getPaymentSettings(this.schoolId()).subscribe({
      next: (settings) => {
        this.patch(settings);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  isSecretVisible(name: string): boolean {
    return this.visibleSecrets().has(name);
  }

  toggleSecret(name: string): void {
    this.visibleSecrets.update((current) => {
      const next = new Set(current);
      if (!next.delete(name)) next.add(name);
      return next;
    });
  }

  /** Editors may read these accounts but only an admin decides where money goes. */
  canManage(): boolean {
    return this.abilities.can('update', 'School', { schoolId: this.schoolId() });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.schoolService
      .setPaymentSettings(this.schoolId(), {
        orangeMoneyEnabled: v.orange.enabled,
        orangeMoneyNumber: v.orange.number,
        orangeMoneyAccountName: v.orange.accountName,
        orangeClientId: v.orange.clientId,
        orangeClientSecret: v.orange.clientSecret,
        orangeAuthToken: v.orange.authToken,
        orangePin: v.orange.pin,
        mtnMomoEnabled: v.mtn.enabled,
        mtnMomoNumber: v.mtn.number,
        mtnMomoAccountName: v.mtn.accountName,
        mtnApiUser: v.mtn.apiUser,
        mtnApiKey: v.mtn.apiKey,
        mtnSubscriptionKey: v.mtn.subscriptionKey,
        paypalEnabled: v.paypal.enabled,
        paypalEmail: v.paypal.email,
        bankTransferEnabled: v.bank.enabled,
        bankName: v.bank.name,
        bankAccountHolder: v.bank.holder,
        bankAccountNumber: v.bank.accountNumber,
        bankSwiftCode: v.bank.swiftCode,
      })
      .subscribe({
        next: (settings) => {
          // Show the values as the API stored them (normalized numbers, codes).
          this.patch(settings);
          this.saving.set(false);
          this.notification.success('SETTINGS.PAYMENT_SAVED');
        },
        error: (err: unknown) => {
          this.saving.set(false);
          // The error interceptor already reports 403/5xx; a 400 is ours to explain.
          if (err instanceof HttpErrorResponse && (err.status === 400 || err.status === 422)) {
            this.notification.error('SETTINGS.PAYMENT_SAVE_ERROR');
          }
        },
      });
  }

  private patch(s: PaymentSettings): void {
    this.form.setValue({
      // Secret inputs always start empty: the API never returns secrets.
      orange: {
        enabled: s.orangeMoneyEnabled,
        secretsSet: s.orangeSecretsSet,
        number: s.orangeMoneyNumber,
        accountName: s.orangeMoneyAccountName,
        clientId: s.orangeClientId,
        clientSecret: '',
        authToken: '',
        pin: '',
      },
      mtn: {
        enabled: s.mtnMomoEnabled,
        secretsSet: s.mtnSecretsSet,
        number: s.mtnMomoNumber,
        accountName: s.mtnMomoAccountName,
        apiUser: s.mtnApiUser,
        apiKey: '',
        subscriptionKey: '',
      },
      paypal: { enabled: s.paypalEnabled, email: s.paypalEmail },
      bank: {
        enabled: s.bankTransferEnabled,
        name: s.bankName,
        holder: s.bankAccountHolder,
        accountNumber: s.bankAccountNumber,
        swiftCode: s.bankSwiftCode,
      },
    });
    this.form.markAsPristine();
  }
}
