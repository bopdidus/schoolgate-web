import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { filter, take } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { Payment, SchoolCommissionSummary } from '../../../domain/models/payment.model';
import { User } from '../../../../../core/auth/models/auth.model';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { SkeletonTableComponent } from '../../../../../shared/components/skeleton-table/skeleton-table.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogResult,
} from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StatusColorPipe } from '../../../../../shared/pipes/status-color.pipe';
import { XafCurrencyPipe } from '../../../../../shared/pipes/xaf-currency.pipe';
import { LocaleDatePipe } from '../../../../../shared/pipes/locale-date.pipe';
import { NotificationService } from '../../../../../core/notifications/notification.service';
import { PAYMENT_DEADLINE_URGENT_HOURS } from '../../../../../shared/constants/payment.constants';
import { selectUser } from '../../../../../core/auth/store/auth.reducer';
import { UserRole } from '../../../../../shared/models/common.model';
import { EDUCATION_TYPE_I18N } from '../../../../../shared/constants/education-system.constants';

@Component({
  selector: 'app-payment-list-page',
  standalone: true,
  imports: [
    DecimalPipe,
    MatTableModule,
    MatPaginatorModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MatChipsModule,
    TranslateModule,
    PageHeaderComponent,
    SkeletonTableComponent,
    EmptyStateComponent,
    StatusColorPipe,
    XafCurrencyPipe,
    LocaleDatePipe,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment-list-page.component.html',
})
export class PaymentListPageComponent implements OnInit {
  private readonly repository = inject(PaymentRepository);
  private readonly dialog = inject(MatDialog);
  private readonly notification = inject(NotificationService);
  private readonly store = inject(Store);

  readonly loading = signal(true);
  readonly payments = signal<Payment[]>([]);
  readonly commissionSummaries = signal<SchoolCommissionSummary[]>([]);
  readonly total = signal(0);
  readonly page = signal(0);
  readonly pageSize = signal(10);
  readonly selectedIds = signal<Set<string>>(new Set());
  readonly statusFilter = signal('');
  readonly educationTypeFilter = signal('');
  readonly specialtyFilter = signal('');
  readonly userRole = signal<UserRole | undefined>(undefined);

  readonly displayedColumns = ['select', 'type', 'educationType', 'specialty', 'amount', 'student', 'declaredAt', 'deadline', 'status', 'actions'];
  readonly commissionColumns = ['school', 'city', 'commissionCount', 'totalCommission', 'actions'];
  readonly educationTypeI18n = EDUCATION_TYPE_I18N;

  /** Only admin and school_admin may validate/reject payments. */
  canValidatePayments(): boolean {
    const r = this.userRole();
    return r === 'admin' || r === 'school_admin';
  }

  ngOnInit(): void {
    this.store
      .select(selectUser)
      .pipe(filter((u): u is User => !!u), take(1))
      .subscribe((u) => {
        this.userRole.set(u.role);
        this.load();
      });
  }

  isAdminView(): boolean {
    return this.userRole() === 'admin';
  }

  load(): void {
    this.loading.set(true);
    if (this.isAdminView()) {
      this.repository.getCommissionSummary().subscribe({
        next: (rows) => {
          this.commissionSummaries.set(rows);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
      return;
    }

    this.repository
      .getAll({
        status: this.statusFilter() as Payment['status'] | '',
        educationType: this.educationTypeFilter() as Payment['classEducationType'] | '',
        specialtyId: this.specialtyFilter() || undefined,
        page: this.page() + 1,
        pageSize: this.pageSize(),
      })
      .subscribe({
        next: (r) => {
          this.payments.set(r.data);
          this.total.set(r.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  getHoursRemaining(deadline: string): number {
    return Math.max(0, (new Date(deadline).getTime() - Date.now()) / 3600000);
  }

  isExpiringSoon(deadline: string): boolean {
    return this.getHoursRemaining(deadline) < PAYMENT_DEADLINE_URGENT_HOURS;
  }

  toggleSelect(id: string): void {
    const set = new Set(this.selectedIds());
    if (set.has(id)) set.delete(id);
    else set.add(id);
    this.selectedIds.set(set);
  }

  validatePayment(payment: Payment): void {
    this.openConfirm('PAYMENTS.VALIDATE_CONFIRM', false, (result) => {
      if (result.confirmed) {
        this.repository.validate({ payment_ids: [payment.id] }).subscribe({
          next: () => {
            this.notification.success('Payment validated');
            this.load();
          },
        });
      }
    });
  }

  rejectPayment(payment: Payment): void {
    this.openConfirm('PAYMENTS.REJECT_CONFIRM', true, (result) => {
      if (result.confirmed) {
        this.repository
          .reject({ payment_ids: [payment.id], reason: result.reason })
          .subscribe({
            next: () => {
              this.notification.success('Payment rejected');
              this.load();
            },
          });
      }
    });
  }

  bulkValidate(): void {
    const ids = Array.from(this.selectedIds());
    if (!ids.length) return;
    this.repository.validate({ payment_ids: ids }).subscribe({
      next: () => {
        this.selectedIds.set(new Set());
        this.notification.success('Payments validated');
        this.load();
      },
    });
  }

  bulkReject(): void {
    const ids = Array.from(this.selectedIds());
    if (!ids.length) return;
    this.openConfirm('PAYMENTS.REJECT_CONFIRM', true, (result) => {
      if (result.confirmed) {
        this.repository.reject({ payment_ids: ids, reason: result.reason }).subscribe({
          next: () => {
            this.selectedIds.set(new Set());
            this.notification.success('Payments rejected');
            this.load();
          },
        });
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  onEducationTypeChange(value: string): void {
    this.educationTypeFilter.set(value);
    this.page.set(0);
    this.load();
  }

  onSpecialtyChange(value: string): void {
    this.specialtyFilter.set(value);
    this.page.set(0);
    this.load();
  }

  trackById(_: number, p: Payment): string {
    return p.id;
  }

  trackBySchoolId(_: number, row: SchoolCommissionSummary): string {
    return row.schoolId;
  }

  educationTypeI18nKey(type: Payment['classEducationType']): string {
    return this.educationTypeI18n[type];
  }

  private openConfirm(
    message: string,
    showReason: boolean,
    callback: (result: ConfirmDialogResult) => void,
  ): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { title: 'COMMON.CONFIRM', message, showReason },
        width: '400px',
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) callback(result);
      });
  }
}
