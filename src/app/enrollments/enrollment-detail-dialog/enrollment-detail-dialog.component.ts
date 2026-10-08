import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';
import {
  Enrollment,
  EnrollmentDocument,
} from '../enrollment.model';
import { EnrollmentService } from '../enrollment.service';
import { Invoice } from '../../invoices/invoice.model';
import { InvoiceService } from '../../invoices/invoice.service';
import { Payment } from '../../payments/payment.model';
import { PaymentService } from '../../payments/payment.service';
import { buildTuitionSummary } from '../tuition-summary';
import { StatusColorPipe } from '../../shared/pipes/status-color.pipe';
import { LocaleDatePipe } from '../../shared/pipes/locale-date.pipe';
import { XafCurrencyPipe } from '../../shared/pipes/xaf-currency.pipe';
import { NotificationService } from '../../core/services/notification.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogResult,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { RejectReasonDialogComponent } from '../reject-reason-dialog/reject-reason-dialog.component';
import { ACTIONABLE_ENROLLMENT_STATUSES } from '../../shared/models/common.model';

export interface EnrollmentDetailDialogData {
  id: string;
  /** Optional list-row snapshot shown until getById resolves. */
  enrollment?: Enrollment;
}

@Component({
  selector: 'app-enrollment-detail-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatProgressBarModule,
    TranslateModule,
    StatusColorPipe,
    LocaleDatePipe,
    XafCurrencyPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './enrollment-detail-dialog.component.html',
  styleUrl: './enrollment-detail-dialog.component.scss',
})
export class EnrollmentDetailDialogComponent implements OnInit {
  private readonly dialogData = inject<Enrollment | EnrollmentDetailDialogData>(MAT_DIALOG_DATA);
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly invoiceService = inject(InvoiceService);
  private readonly paymentService = inject(PaymentService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly dialogRef = inject(MatDialogRef<EnrollmentDetailDialogComponent>);

  readonly enrollment = signal<Enrollment | null>(null);
  readonly loading = signal(true);
  readonly invoices = signal<Invoice[]>([]);
  readonly invoicesLoading = signal(true);
  /** Null until the student's payments are loaded (or if loading failed). */
  readonly payments = signal<Payment[] | null>(null);
  /** Tuition paid / total / remaining; null when unknown or the class has no installments. */
  readonly tuition = computed(() => {
    const payments = this.payments();
    const installments = this.enrollment()?.tuitionInstallments ?? [];
    return payments && installments.length > 0 ? buildTuitionSummary(installments, payments) : null;
  });
  readonly actionLoading = signal(false);
  readonly downloadingDocId = signal<string | null>(null);

  private get enrollmentId(): string {
    const data = this.dialogData;
    if (data && typeof data === 'object' && 'id' in data) {
      return String(data.id);
    }
    return '';
  }

  ngOnInit(): void {
    const data = this.dialogData;
    if (data && 'enrollment' in data && data.enrollment) {
      this.enrollment.set(data.enrollment);
    } else if (data && 'studentName' in data) {
      this.enrollment.set(data as Enrollment);
    }

    const id = this.enrollmentId;
    this.enrollmentService.getById(id).subscribe({
      next: (detail) => {
        this.enrollment.set(detail);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notification.error('COMMON.ERROR');
      },
    });

    this.paymentService.getAll({ enrollmentId: id, pageSize: 100 }).subscribe({
      next: (res) => this.payments.set(res.data),
      error: () => this.payments.set(null),
    });

    this.invoiceService.getAll({ enrollmentId: id, pageSize: 50 }).subscribe({
      next: (res) => {
        this.invoices.set(res.data);
        this.invoicesLoading.set(false);
      },
      error: () => this.invoicesLoading.set(false),
    });
  }

  canAct(): boolean {
    const e = this.enrollment();
    if (!e) return false;
    return (ACTIONABLE_ENROLLMENT_STATUSES as string[]).includes(e.status);
  }

  downloadDocument(doc: EnrollmentDocument): void {
    const e = this.enrollment();
    if (!e) return;
    this.downloadingDocId.set(doc.id);
    this.enrollmentService.downloadDocument(e.id, doc.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.filename || `document-${doc.id}`;
        link.click();
        URL.revokeObjectURL(url);
        this.downloadingDocId.set(null);
      },
      error: () => {
        this.downloadingDocId.set(null);
        this.notification.error('COMMON.ERROR');
      },
    });
  }

  accept(): void {
    const e = this.enrollment();
    if (!e) return;
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'COMMON.CONFIRM',
          message: 'ENROLLMENTS.ACCEPT_CONFIRM',
          confirmLabel: 'ENROLLMENTS.ACCEPT',
        },
        width: '400px',
      })
      .afterClosed()
      .subscribe((result: ConfirmDialogResult | undefined) => {
        if (!result?.confirmed) return;
        this.actionLoading.set(true);
        this.enrollmentService.accept(e.id).subscribe({
          next: () => {
            this.actionLoading.set(false);
            this.notification.success('ENROLLMENTS.ACCEPTED_OK');
            this.dialogRef.close({ accepted: true });
          },
          error: () => {
            this.actionLoading.set(false);
            this.notification.error('COMMON.ERROR');
          },
        });
      });
  }

  reject(): void {
    const e = this.enrollment();
    if (!e) return;
    this.dialog
      .open(RejectReasonDialogComponent, {
        width: '420px',
        data: { studentName: e.studentName },
      })
      .afterClosed()
      .subscribe((reason: string | undefined) => {
        if (!reason) return;
        this.actionLoading.set(true);
        this.enrollmentService.reject(e.id, { reason }).subscribe({
          next: () => {
            this.actionLoading.set(false);
            this.notification.success('ENROLLMENTS.REJECTED_OK');
            this.dialogRef.close({ rejected: true });
          },
          error: () => {
            this.actionLoading.set(false);
            this.notification.error('COMMON.ERROR');
          },
        });
      });
  }

  openInvoice(invoice: Invoice): void {
    this.dialogRef.close();
    void this.router.navigate(['/invoices', invoice.id]);
  }
}
