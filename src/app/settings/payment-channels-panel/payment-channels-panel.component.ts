import { Component, DestroyRef, inject, input, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { forkJoin, interval, Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';
import { SchoolService } from '../../schools/school.service';
import {
  KycDocument,
  KycDocumentType,
  PaymentChannel,
  PaymentChannelMethod,
  PaymentChannelReviewAction,
} from '../../schools/school.model';
import { NotificationService } from '../../core/services/notification.service';
import { AbilityService } from '../../core/services/ability.service';
import { LocaleDatePipe } from '../../shared/pipes/locale-date.pipe';
import { normalizeCameroonMobile } from '../payment-settings-panel/payment-settings-panel.component';

export const KYC_DOCUMENT_TYPES: KycDocumentType[] = [
  'rccm',
  'niu',
  'autorisation_ouverture',
  'cni_representant',
  'rib',
  'contrat_marchand_orange',
  'contrat_mtn',
];

/** Matches the API limit (5 MB) so a too-big file fails before uploading. */
const MAX_KYC_BYTES = 5 * 1024 * 1024;
/** How often a pending test payment is checked with the operator. */
const TEST_POLL_MS = 5000;

@Component({
  selector: 'app-payment-channels-panel',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    TranslateModule,
    LocaleDatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment-channels-panel.component.html',
  styleUrl: './payment-channels-panel.component.scss',
})
export class PaymentChannelsPanelComponent implements OnInit {
  readonly schoolId = input.required<string>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly schoolService = inject(SchoolService);
  private readonly notification = inject(NotificationService);
  private readonly abilities = inject(AbilityService);

  readonly documentTypes = KYC_DOCUMENT_TYPES;
  readonly loading = signal(true);
  readonly busy = signal<string | null>(null);
  readonly channels = signal<PaymentChannel[]>([]);
  readonly documents = signal<KycDocument[]>([]);

  uploadType: KycDocumentType | null = null;
  /** Phone the school pays the test from, per method. */
  readonly testPhone: Record<PaymentChannelMethod, string> = { orange: '', mtn: '' };
  /** Admin note per method (required to reject or suspend). */
  readonly reviewNote: Record<PaymentChannelMethod, string> = { orange: '', mtn: '' };

  private poll: Subscription | null = null;

  ngOnInit(): void {
    this.reload();
  }

  /** Called by the parent after the payment settings were saved: a changed account resets its channel. */
  reload(): void {
    // Editors may see the channels; papers hold ID cards and stay with the school's admins.
    const docs$ = this.canManage() ? this.schoolService.getKycDocuments(this.schoolId()) : null;
    forkJoin({
      channels: this.schoolService.getPaymentChannels(this.schoolId()),
      ...(docs$ ? { documents: docs$ } : {}),
    }).subscribe({
      next: (res) => {
        this.channels.set(res.channels);
        this.documents.set((res as { documents?: KycDocument[] }).documents ?? []);
        this.loading.set(false);
        this.watchPendingTests();
      },
      error: () => this.loading.set(false),
    });
  }

  canManage(): boolean {
    return this.abilities.can('update', 'School', { schoolId: this.schoolId() });
  }

  /** Only a platform admin holds the unscoped rule. */
  isPlatformAdmin(): boolean {
    return this.abilities.can('update', 'School');
  }

  documentsOfType(type: KycDocumentType): KycDocument[] {
    return this.documents().filter((d) => d.type === type);
  }

  submit(method: PaymentChannelMethod): void {
    this.run(method, this.schoolService.submitPaymentChannel(this.schoolId(), method), 'PAYMENT_CHANNELS.SUBMITTED');
  }

  review(method: PaymentChannelMethod, action: PaymentChannelReviewAction): void {
    const note = this.reviewNote[method].trim();
    if ((action === 'reject' || action === 'suspend') && !note) {
      this.notification.error('PAYMENT_CHANNELS.NOTE_REQUIRED');
      return;
    }
    this.run(
      method,
      this.schoolService.reviewPaymentChannel(this.schoolId(), method, action, note),
      'PAYMENT_CHANNELS.REVIEWED',
      () => {
        this.reviewNote[method] = '';
        // Approval also approves the documents: show their new status.
        if (action === 'approve') this.reloadDocuments();
      },
    );
  }

  startTest(method: PaymentChannelMethod): void {
    const phone = normalizeCameroonMobile(this.testPhone[method]);
    if (!/^6\d{8}$/.test(phone)) {
      this.notification.error('SETTINGS.PAYMENT_MOBILE_INVALID');
      return;
    }
    this.run(method, this.schoolService.startPaymentChannelTest(this.schoolId(), method, phone), null, () =>
      this.watchPendingTests(),
    );
  }

  syncTest(method: PaymentChannelMethod): void {
    this.schoolService.syncPaymentChannelTest(this.schoolId(), method).subscribe({
      next: (channel) => {
        const before = this.channels().find((c) => c.method === method);
        this.replace(channel);
        if (before?.status !== 'active' && channel.status === 'active') {
          this.notification.success('PAYMENT_CHANNELS.ACTIVATED');
        }
        this.watchPendingTests();
      },
    });
  }

  onFileSelected(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    inputEl.value = '';
    if (!file || !this.uploadType) return;
    if (file.size > MAX_KYC_BYTES) {
      this.notification.error('PAYMENT_CHANNELS.FILE_TOO_BIG');
      return;
    }
    this.busy.set('upload');
    this.schoolService.uploadKycDocument(this.schoolId(), this.uploadType, file).subscribe({
      next: () => {
        this.busy.set(null);
        this.uploadType = null;
        this.notification.success('PAYMENT_CHANNELS.UPLOADED');
        this.reload();
      },
      error: (err: unknown) => {
        this.busy.set(null);
        if (err instanceof HttpErrorResponse && (err.status === 400 || err.status === 422)) {
          this.notification.error('PAYMENT_CHANNELS.UPLOAD_ERROR');
        }
      },
    });
  }

  open(doc: KycDocument): void {
    this.schoolService.downloadKycDocument(this.schoolId(), doc.id).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    });
  }

  remove(doc: KycDocument): void {
    this.busy.set('doc-' + doc.id);
    this.schoolService.deleteKycDocument(this.schoolId(), doc.id).subscribe({
      next: () => {
        this.busy.set(null);
        this.reload();
      },
      error: () => this.busy.set(null),
    });
  }

  private reloadDocuments(): void {
    this.schoolService.getKycDocuments(this.schoolId()).subscribe((docs) => this.documents.set(docs));
  }

  private run(
    method: PaymentChannelMethod,
    request: ReturnType<SchoolService['submitPaymentChannel']>,
    successKey: string | null,
    after?: () => void,
  ): void {
    this.busy.set(method);
    request.subscribe({
      next: (channel) => {
        this.busy.set(null);
        this.replace(channel);
        if (successKey) this.notification.success(successKey);
        after?.();
      },
      error: (err: unknown) => {
        this.busy.set(null);
        if (err instanceof HttpErrorResponse && err.status >= 400 && err.status < 500 && err.status !== 403) {
          this.notification.error('PAYMENT_CHANNELS.ACTION_ERROR');
        }
      },
    });
  }

  private replace(channel: PaymentChannel): void {
    this.channels.update((list) => list.map((c) => (c.method === channel.method ? channel : c)));
  }

  /** Polls the operator while a test payment waits for the school's confirmation. */
  private watchPendingTests(): void {
    const pending = this.channels().filter((c) => c.testStatus === 'pending');
    if (pending.length === 0 || !this.canManage()) {
      this.poll?.unsubscribe();
      this.poll = null;
      return;
    }
    if (this.poll) return;
    this.poll = interval(TEST_POLL_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        for (const c of this.channels().filter((ch) => ch.testStatus === 'pending')) {
          this.syncTest(c.method);
        }
      });
  }
}
