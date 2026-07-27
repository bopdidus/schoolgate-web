import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { Enrollment } from '../../../domain/models/enrollment.model';
import { Invoice } from '../../../../invoices/domain/models/invoice.model';
import { InvoiceRepository } from '../../../../invoices/infrastructure/invoice.repository';
import { StatusColorPipe } from '../../../../../shared/pipes/status-color.pipe';
import { LocaleDatePipe } from '../../../../../shared/pipes/locale-date.pipe';
import { XafCurrencyPipe } from '../../../../../shared/pipes/xaf-currency.pipe';

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
    TranslateModule,
    StatusColorPipe,
    LocaleDatePipe,
    XafCurrencyPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ 'ENROLLMENTS.DETAIL' | translate }}</h2>

    <mat-dialog-content>
      <mat-chip-set>
        <mat-chip [class]="data.status | statusColor">{{ data.status }}</mat-chip>
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
          <span matListItemLine>{{ data.studentName }}</span>
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

      @if (!data.isExistingStudent) {
        <mat-divider />
        <h3>{{ 'ENROLLMENTS.DOCUMENTS' | translate }}</h3>
        <mat-list>
          <mat-list-item>
            <mat-icon matListItemIcon>description</mat-icon>
            <span matListItemLine>{{ 'ENROLLMENTS.REPORT_CARD_N1' | translate }}</span>
          </mat-list-item>
          <mat-list-item>
            <mat-icon matListItemIcon>description</mat-icon>
            <span matListItemLine>{{ 'ENROLLMENTS.REPORT_CARD_N2' | translate }}</span>
          </mat-list-item>
        </mat-list>
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
                {{ inv.issuedAt | localeDate }} · {{ inv.status }}
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
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'COMMON.CLOSE' | translate }}</button>
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
  `,
})
export class EnrollmentDetailDialogComponent implements OnInit {
  readonly data = inject<Enrollment>(MAT_DIALOG_DATA);
  private readonly invoiceRepo = inject(InvoiceRepository);
  private readonly router = inject(Router);
  private readonly dialogRef = inject(MatDialogRef<EnrollmentDetailDialogComponent>);

  readonly invoices = signal<Invoice[]>([]);
  readonly invoicesLoading = signal(true);

  ngOnInit(): void {
    this.invoiceRepo.getAll({ enrollmentId: this.data.id, pageSize: 50 }).subscribe({
      next: (res) => {
        this.invoices.set(res.data);
        this.invoicesLoading.set(false);
      },
      error: () => this.invoicesLoading.set(false),
    });
  }

  openInvoice(invoice: Invoice): void {
    this.dialogRef.close();
    void this.router.navigate(['/invoices', invoice.id]);
  }
}
