import { Component, ChangeDetectionStrategy, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, lastValueFrom, of, catchError } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { SkeletonTableComponent } from '../../shared/components/skeleton-table/skeleton-table.component';
import { CentsPipe } from '../shared/cents.pipe';
import { MobileMoneyMethod, ParentEnrollment, ParentPayment } from '../domain/models';
import { serviceFeeCents } from '../domain/money';
import { PayableLines, PaymentOption } from '../domain/payable-lines';
import { ParentEnrollmentsService } from '../services/parent-enrollments.service';
import { ParentPaymentsService } from '../services/parent-payments.service';
import { ParentSchoolsService } from '../services/parent-schools.service';

/** Polling the operator: every 2 s for about 3 minutes, as on the mobile app. */
export const POLL_INTERVAL_MS = 2_000;
export const POLL_MAX_ATTEMPTS = 90;

/** Cameroon mobile: 9 digits starting with 6; spaces and +237 are accepted. */
export function normalizeMsisdn(raw: string): string {
  let s = raw.replace(/[\s.-]/g, '');
  if (s.startsWith('+')) s = s.slice(1);
  if (s.startsWith('00')) s = s.slice(2);
  if (s.length === 12 && s.startsWith('237')) s = s.slice(3);
  return s;
}

const MSISDN_PATTERN = /^6\d{8}$/;

/**
 * Pay by Mobile Money (mobile merchant payment screen): the lines still owed
 * (enrollment fee, next installment, or both; an advance where allowed), the
 * school's share plus the service fee, the operator and the payer's number.
 * Each line is one payment: the operator pushes a prompt to the phone, then
 * the page follows it until the operator confirms or refuses.
 */
@Component({
  selector: 'app-parent-pay',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    TranslateModule,
    PageHeaderComponent,
    ErrorStateComponent,
    SkeletonTableComponent,
    CentsPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pay.component.html',
  styleUrl: './pay.component.scss',
})
export class PayComponent implements OnInit {
  /** Route parameter `:id`. */
  readonly id = input.required<string>();
  /** Query parameter `mode=tuition`: a returning student's tuition only. */
  readonly mode = input<string>();

  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly enrollmentsService = inject(ParentEnrollmentsService);
  private readonly paymentsService = inject(ParentPaymentsService);
  private readonly schoolsService = inject(ParentSchoolsService);
  private destroyed = false;

  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly enrollment = signal<ParentEnrollment | null>(null);
  private readonly payments = signal<ParentPayment[]>([]);
  readonly feePercent = signal(0);
  readonly methods = signal<MobileMoneyMethod[]>([]);

  readonly option = signal<PaymentOption>('combined');
  readonly advance = signal(false);
  readonly method = signal<MobileMoneyMethod | null>(null);
  readonly msisdn = new FormControl('', { nonNullable: true, validators: [Validators.required] });

  readonly submitting = signal(false);
  readonly awaitingPhone = signal(false);
  readonly error = signal<string | null>(null);

  readonly lines = computed(() => {
    const e = this.enrollment();
    return e?.offering ? PayableLines.from(e.offering, this.payments(), this.mode() === 'tuition') : null;
  });

  readonly resolvedOption = computed(() => this.lines()?.resolve(this.option()) ?? null);

  readonly items = computed(() => {
    const lines = this.lines();
    const option = this.resolvedOption();
    return lines && option ? lines.items(option, this.advance()) : [];
  });

  /** The selected lines that allow an advance right now. */
  readonly advanceLines = computed(() => {
    const lines = this.lines();
    const option = this.resolvedOption();
    return lines && option ? lines.selected(option).filter((l) => l.canPayAdvance) : [];
  });

  readonly schoolCents = computed(() => this.items().reduce((sum, i) => sum + i.amountCents, 0));
  /** The fee applies per payment, like the API: one per line. */
  readonly feeCents = computed(() =>
    this.items().reduce((sum, i) => sum + serviceFeeCents(this.feePercent(), i.amountCents), 0),
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => (this.destroyed = true));
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    forkJoin({
      enrollment: this.enrollmentsService.getById(this.id()),
      payments: this.paymentsService.forEnrollment(this.id()),
      feePercent: this.paymentsService.feePercent(),
    }).subscribe({
      next: ({ enrollment, payments, feePercent }) => {
        this.enrollment.set(enrollment);
        this.payments.set(payments);
        this.feePercent.set(feePercent);
        this.schoolsService
          .paymentMethods(enrollment.schoolId)
          .pipe(catchError(() => of([] as MobileMoneyMethod[])))
          .subscribe((methods) => {
            this.methods.set(methods);
            this.method.set(methods[0] ?? null);
            this.loading.set(false);
          });
      },
      error: () => {
        // The parent must see the fee before paying: no policy, no payment.
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  optionTitle(option: PaymentOption): string {
    const n = this.lines()?.installment?.installmentNumber ?? '';
    switch (option) {
      case 'enrollment_only':
        return this.translate.instant('PARENT.OPTION_ENROLLMENT_ONLY');
      case 'installment_only':
        return this.translate.instant('PARENT.INSTALLMENT_N', { n });
      case 'combined':
        return this.translate.instant('PARENT.OPTION_COMBINED', { n });
    }
  }

  optionTotal(option: PaymentOption): number {
    return (this.lines()?.selected(option) ?? []).reduce((sum, l) => sum + l.amountCents(this.advance()), 0);
  }

  advanceCents(): number {
    return this.advanceLines().reduce((sum, l) => sum + (l.advanceMinCents ?? 0), 0);
  }

  async pay(): Promise<void> {
    const msisdn = normalizeMsisdn(this.msisdn.value);
    const method = this.method();
    if (!MSISDN_PATTERN.test(msisdn)) {
      this.msisdn.setErrors({ msisdn: true });
      this.msisdn.markAsTouched();
      return;
    }
    if (!method || this.items().length === 0) return;

    this.submitting.set(true);
    this.error.set(null);
    try {
      // One prompt at a time: start a line, follow it, then the next one.
      for (const item of this.items()) {
        const started = await lastValueFrom(this.paymentsService.declare(this.id(), item, method, msisdn));
        this.awaitingPhone.set(true);
        const settled = await this.followUntilSettled(started.id);
        if (settled.status === 'rejected') {
          throw new Error(this.translate.instant('PARENT.PAYMENT_REJECTED'));
        }
      }
      void this.router.navigate(['/parent/confirmation', this.id()]);
    } catch (e) {
      if (this.destroyed) return;
      // API errors are already shown by the HTTP error interceptor.
      this.error.set(e instanceof Error && !('status' in e) ? e.message : null);
      this.submitting.set(false);
      this.awaitingPhone.set(false);
    }
  }

  private async followUntilSettled(paymentId: string): Promise<ParentPayment> {
    for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS && !this.destroyed; attempt++) {
      const payment = await lastValueFrom(this.paymentsService.sync(paymentId));
      if (payment.status === 'validated' || payment.status === 'rejected') return payment;
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
    throw new Error(this.translate.instant('PARENT.PAYMENT_SYNC_TIMEOUT'));
  }
}
