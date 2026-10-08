import { Component, ChangeDetectionStrategy, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { SkeletonTableComponent } from '../../shared/components/skeleton-table/skeleton-table.component';
import { StatusColorPipe } from '../../shared/pipes/status-color.pipe';
import { LocaleDatePipe } from '../../shared/pipes/locale-date.pipe';
import { NotificationService } from '../../core/services/notification.service';
import { CentsPipe } from '../shared/cents.pipe';
import { ChecklistItem, ParentEnrollment, ParentPayment } from '../domain/models';
import { enrollmentFeeProgress, tuitionSummaryFor } from '../domain/balance';
import { PayableLines } from '../domain/payable-lines';
import { ParentEnrollmentsService } from '../services/parent-enrollments.service';
import { ParentPaymentsService } from '../services/parent-payments.service';
import { ParentInvoice, ParentInvoicesService } from '../services/parent-invoices.service';
import { ACCEPTED_DOCUMENT_TYPES, MAX_DOCUMENT_BYTES } from '../enroll/enroll.component';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * One enrollment (mobile enrollment detail): status and deadlines, the
 * student, the enrollment fee and tuition progress, documents to provide,
 * payments and their invoices, and the way to pay.
 */
@Component({
  selector: 'app-parent-enrollment-detail',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    TranslateModule,
    PageHeaderComponent,
    ErrorStateComponent,
    SkeletonTableComponent,
    StatusColorPipe,
    LocaleDatePipe,
    CentsPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './enrollment-detail.component.html',
  styleUrl: './enrollment-detail.component.scss',
})
export class EnrollmentDetailComponent implements OnInit {
  /** Route parameter `:id`. */
  readonly id = input.required<string>();

  private readonly enrollmentsService = inject(ParentEnrollmentsService);
  private readonly paymentsService = inject(ParentPaymentsService);
  private readonly invoicesService = inject(ParentInvoicesService);
  private readonly notification = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly uploading = signal<string | null>(null);
  readonly enrollment = signal<ParentEnrollment | null>(null);
  readonly payments = signal<ParentPayment[]>([]);
  readonly checklist = signal<ChecklistItem[]>([]);
  readonly invoices = signal<ParentInvoice[]>([]);

  readonly fee = computed(() => {
    const e = this.enrollment();
    return e?.offering && e.offering.enrollmentFeeCents > 0 ? enrollmentFeeProgress(e.offering, this.payments()) : null;
  });

  readonly tuition = computed(() => {
    const e = this.enrollment();
    return e?.offering && e.offering.installments.length > 0 ? tuitionSummaryFor(e.offering, this.payments()) : null;
  });

  /** Something is left to pay on an accepted enrollment. */
  readonly canPay = computed(() => {
    const e = this.enrollment();
    if (!e?.offering || e.status !== 'active') return false;
    return PayableLines.from(e.offering, this.payments()).available.length > 0;
  });

  /** Whole days until the payment deadline (negative once overdue). */
  readonly paymentDaysLeft = computed(() => {
    const due = this.enrollment()?.paymentDueAt;
    return due ? Math.ceil((new Date(due).getTime() - Date.now()) / DAY_MS) : null;
  });

  readonly sortedPayments = computed(() =>
    [...this.payments()].sort((a, b) => (b.declaredAt ?? '').localeCompare(a.declaredAt ?? '')),
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    forkJoin({
      enrollment: this.enrollmentsService.getById(this.id()),
      payments: this.paymentsService.forEnrollment(this.id()).pipe(catchError(() => of([] as ParentPayment[]))),
      checklist: this.enrollmentsService.checklist(this.id()).pipe(catchError(() => of([] as ChecklistItem[]))),
      invoices: this.invoicesService.list().pipe(catchError(() => of([] as ParentInvoice[]))),
    }).subscribe({
      next: ({ enrollment, payments, checklist, invoices }) => {
        this.enrollment.set(enrollment);
        this.payments.set(payments);
        this.checklist.set(checklist);
        // Invoices of this enrollment: those of its payments.
        const ids = new Set(payments.map((p) => p.id));
        this.invoices.set(invoices.filter((i) => ids.has(i.paymentId)));
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  /** Automatic rejections carry a code localized by the app; manual ones the school's text. */
  rejectionText(e: ParentEnrollment): string {
    if (e.rejectionReasonCode) {
      const key = `API_CODES.${e.rejectionReasonCode}`;
      const text = this.translate.instant(key);
      if (text !== key) return text;
    }
    return e.rejectionReason ?? '';
  }

  paymentLabel(p: ParentPayment): string {
    return p.type === 'enrollment_fee'
      ? this.translate.instant('PARENT.ENROLLMENT_FEE')
      : this.translate.instant('PARENT.INSTALLMENT_N', { n: p.installmentNumber ?? '' });
  }

  onFiles(event: Event, item: ChecklistItem): void {
    const inputEl = event.target as HTMLInputElement;
    const files = Array.from(inputEl.files ?? []).filter((f) => {
      if (!ACCEPTED_DOCUMENT_TYPES.includes(f.type)) {
        this.notification.error('PARENT.DOCUMENT_BAD_TYPE');
        return false;
      }
      if (f.size > MAX_DOCUMENT_BYTES) {
        this.notification.error('PARENT.DOCUMENT_TOO_LARGE');
        return false;
      }
      return true;
    });
    inputEl.value = '';
    if (files.length === 0) return;
    this.uploading.set(item.documentType.id);
    this.enrollmentsService.uploadDocuments(this.id(), files, item.documentType.id).subscribe({
      next: () => {
        this.uploading.set(null);
        this.notification.success('PARENT.DOCUMENT_UPLOADED');
        this.enrollmentsService.checklist(this.id()).subscribe((c) => this.checklist.set(c));
      },
      error: () => this.uploading.set(null),
    });
  }
}
