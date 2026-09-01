import {
  Component,
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
import { TranslateModule } from '@ngx-translate/core';
import {
  Enrollment,
  EnrollmentDocument,
} from '../../../domain/models/enrollment.model';
import { EnrollmentRepository } from '../../../infrastructure/enrollment.repository';
import { Invoice } from '../../../../invoices/domain/models/invoice.model';
import { InvoiceRepository } from '../../../../invoices/infrastructure/invoice.repository';
import { StatusColorPipe } from '../../../../../shared/pipes/status-color.pipe';
import { LocaleDatePipe } from '../../../../../shared/pipes/locale-date.pipe';
import { XafCurrencyPipe } from '../../../../../shared/pipes/xaf-currency.pipe';
import { NotificationService } from '../../../../../core/notifications/notification.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogResult,
} from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { RejectReasonDialogComponent } from '../reject-reason-dialog/reject-reason-dialog.component';
import { ACTIONABLE_ENROLLMENT_STATUSES } from '../../../../../shared/models/common.model';

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
    TranslateModule,
    StatusColorPipe,
    LocaleDatePipe,
    XafCurrencyPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ 'ENROLLMENTS.DETAIL' | translate }}</h2>

    <mat-dialog-content>
      @if (loading()) {
        <div class="loading-wrap">
          <mat-spinner diameter="36" />
        </div>
      } @else if (enrollment(); as data) {
        <mat-chip-set>
          <mat-chip [class]="data.status | statusColor">{{ ('STATUS.' + data.status.toUpperCase()) | translate }}</mat-chip>
          @if (data.isExistingStudent) {
            <mat-chip>{{ 'ENROLLMENTS.EXISTING_STUDENT' | translate }}</mat-chip>
          } @else {
            <mat-chip>{{ 'ENROLLMENTS.NEW_STUDENT' | translate }}</mat-chip>
          }
          @if (data.paymentValidated) {
            <mat-chip highlighted>{{ 'ENROLLMENTS.PAYMENT_VALIDATED' | translate }}</mat-chip>
          }
        </mat-chip-set>

        <mat-divider />

        <mat-list>
          <mat-list-item>
            <mat-icon matListItemIcon>person</mat-icon>
            <span matListItemTitle>{{ 'ENROLLMENTS.STUDENT' | translate }}</span>
            <span matListItemLine>{{ data.studentName || '—' }}</span>
          </mat-list-item>
          @if (data.studentPhone) {
            <mat-list-item>
              <mat-icon matListItemIcon>phone</mat-icon>
              <span matListItemTitle>{{ 'ENROLLMENTS.PHONE' | translate }}</span>
              <span matListItemLine>{{ data.studentPhone }}</span>
            </mat-list-item>
          }
          @if (data.studentEmail) {
            <mat-list-item>
              <mat-icon matListItemIcon>email</mat-icon>
              <span matListItemTitle>{{ 'ENROLLMENTS.EMAIL' | translate }}</span>
              <span matListItemLine>{{ data.studentEmail }}</span>
            </mat-list-item>
          }
          <mat-list-item>
            <mat-icon matListItemIcon>school</mat-icon>
            <span matListItemTitle>{{ 'ENROLLMENTS.SCHOOL' | translate }}</span>
            <span matListItemLine>{{ data.schoolName }}</span>
          </mat-list-item>
          <mat-list-item>
            <mat-icon matListItemIcon>class</mat-icon>
            <span matListItemTitle>{{ 'ENROLLMENTS.CLASS' | translate }}</span>
            <span matListItemLine>
              {{ data.className }}
              · {{ (data.classSystem === 'anglophone' ? 'EDUCATION.ANGLOPHONE' : 'EDUCATION.FRANCOPHONE') | translate }}
            </span>
          </mat-list-item>
          @if (data.academicYear) {
            <mat-list-item>
              <mat-icon matListItemIcon>calendar_month</mat-icon>
              <span matListItemTitle>{{ 'ENROLLMENTS.ACADEMIC_YEAR' | translate }}</span>
              <span matListItemLine>{{ data.academicYear }}</span>
            </mat-list-item>
          }
          <mat-list-item>
            <mat-icon matListItemIcon>event</mat-icon>
            <span matListItemTitle>{{ 'ENROLLMENTS.DATE' | translate }}</span>
            <span matListItemLine>{{ data.createdAt | localeDate }}</span>
          </mat-list-item>
        </mat-list>

        @if (data.reviewedByUserId != null && data.reviewedAt) {
          <mat-divider />
          <p class="audit-line">
            {{
              'ENROLLMENTS.REVIEWED_BY'
                | translate
                  : {
                      userId: data.reviewedByUserId,
                      date: (data.reviewedAt | localeDate: 'long'),
                    }
            }}
          </p>
        }

        @if (!data.isExistingStudent) {
          <mat-divider />
          <h3>{{ 'ENROLLMENTS.DOCUMENTS' | translate }}</h3>
          @if (!(data.documents?.length)) {
            <p>{{ 'ENROLLMENTS.NO_DOCUMENTS' | translate }}</p>
          } @else {
            <mat-list>
              @for (doc of data.documents; track doc.id) {
                <mat-list-item>
                  <mat-icon matListItemIcon>description</mat-icon>
                  <span matListItemTitle>{{ doc.filename }}</span>
                  @if (doc.createdAt) {
                    <span matListItemLine>{{ doc.createdAt | localeDate }}</span>
                  }
                  <button
                    mat-icon-button
                    matListItemMeta
                    [disabled]="downloadingDocId() === doc.id"
                    (click)="downloadDocument(doc)"
                    [matTooltip]="'ENROLLMENTS.DOWNLOAD_DOCUMENT' | translate"
                    [attr.aria-label]="'ENROLLMENTS.DOWNLOAD_DOCUMENT' | translate"
                  >
                    <mat-icon>download</mat-icon>
                  </button>
                </mat-list-item>
              }
            </mat-list>
          }
          <p>
            {{ 'COMMON.STATUS' | translate }}:
            @if (data.documentsReceived) {
              <mat-chip>{{ 'ENROLLMENTS.DOCUMENTS_RECEIVED' | translate }}</mat-chip>
            } @else {
              <mat-chip>{{ 'ENROLLMENTS.DOCUMENTS_PENDING' | translate }}</mat-chip>
            }
          </p>
        }

        @if (data.status === 'rejected' && data.rejectionReason) {
          <mat-divider />
          <p><strong>{{ 'ENROLLMENTS.REJECT_REASON' | translate }}</strong></p>
          <p>{{ data.rejectionReason }}</p>
        }

        <mat-divider />
        <h3>{{ 'ENROLLMENTS.LINKED_INVOICES' | translate }}</h3>

        @if (invoicesLoading()) {
          <mat-spinner diameter="32" />
        } @else if (invoices().length === 0) {
          <p>{{ 'ENROLLMENTS.NO_INVOICES' | translate }}</p>
        } @else {
          <mat-list>
            @for (inv of invoices(); track inv.id) {
              <mat-list-item>
                <mat-icon matListItemIcon>receipt_long</mat-icon>
                <span matListItemTitle>
                  {{ inv.amount | xafCurrency }}
                  @if (inv.installmentNumber) {
                    — {{ 'INVOICES.INSTALLMENT' | translate }} {{ inv.installmentNumber }}
                  }
                </span>
                <span matListItemLine>
                  {{ inv.issuedAt | localeDate }} · {{ ('STATUS.' + inv.status.toUpperCase()) | translate }}
                </span>
                <button
                  mat-icon-button
                  matListItemMeta
                  (click)="openInvoice(inv)"
                  [attr.aria-label]="'COMMON.VIEW' | translate"
                >
                  <mat-icon>open_in_new</mat-icon>
                </button>
              </mat-list-item>
            }
          </mat-list>
        }
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'COMMON.CLOSE' | translate }}</button>
      @if (canAct()) {
        <button
          mat-button
          color="warn"
          [disabled]="actionLoading()"
          (click)="reject()"
        >
          {{ 'ENROLLMENTS.REJECT' | translate }}
        </button>
        <button
          mat-flat-button
          color="primary"
          [disabled]="actionLoading()"
          (click)="accept()"
        >
          {{ 'ENROLLMENTS.ACCEPT' | translate }}
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: `
    mat-dialog-content {
      min-width: 360px;
      max-width: 520px;
    }
    mat-chip-set {
      margin-bottom: 16px;
    }
    mat-divider {
      margin: 16px 0;
    }
    h3 {
      margin: 0 0 8px;
      font-size: 14px;
      font-weight: 600;
    }
    mat-spinner {
      margin: 8px 0;
    }
    .loading-wrap {
      display: flex;
      justify-content: center;
      padding: 32px 0;
    }
    .audit-line {
      margin: 0;
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant, rgba(0, 0, 0, 0.6));
    }
  `,
})
export class EnrollmentDetailDialogComponent implements OnInit {
  private readonly dialogData = inject<Enrollment | EnrollmentDetailDialogData>(MAT_DIALOG_DATA);
  private readonly enrollmentRepo = inject(EnrollmentRepository);
  private readonly invoiceRepo = inject(InvoiceRepository);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly dialogRef = inject(MatDialogRef<EnrollmentDetailDialogComponent>);

  readonly enrollment = signal<Enrollment | null>(null);
  readonly loading = signal(true);
  readonly invoices = signal<Invoice[]>([]);
  readonly invoicesLoading = signal(true);
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
    this.enrollmentRepo.getById(id).subscribe({
      next: (detail) => {
        this.enrollment.set(detail);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notification.error('COMMON.ERROR');
      },
    });

    this.invoiceRepo.getAll({ enrollmentId: id, pageSize: 50 }).subscribe({
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
    this.enrollmentRepo.downloadDocument(e.id, doc.id).subscribe({
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
        this.enrollmentRepo.accept(e.id).subscribe({
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
        this.enrollmentRepo.reject(e.id, { reason }).subscribe({
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
