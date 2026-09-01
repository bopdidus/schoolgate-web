import { DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { filter, take } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { PaymentRepository } from '../../../infrastructure/payment.repository';
import { Payment } from '../../../domain/models/payment.model';
import { User } from '../../../../../core/auth/models/auth.model';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { SkeletonTableComponent } from '../../../../../shared/components/skeleton-table/skeleton-table.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { StatusColorPipe } from '../../../../../shared/pipes/status-color.pipe';
import { XafCurrencyPipe } from '../../../../../shared/pipes/xaf-currency.pipe';
import { LocaleDatePipe } from '../../../../../shared/pipes/locale-date.pipe';
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
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    TranslateModule,
    PageHeaderComponent,
    SkeletonTableComponent,
    EmptyStateComponent,
    StatusColorPipe,
    XafCurrencyPipe,
    LocaleDatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment-list-page.component.html',
})
export class PaymentListPageComponent implements OnInit {
  private readonly repository = inject(PaymentRepository);
  private readonly store = inject(Store);

  readonly loading = signal(true);
  readonly payments = signal<Payment[]>([]);
  readonly total = signal(0);
  readonly page = signal(0);
  readonly pageSize = signal(10);
  readonly statusFilter = signal('');
  readonly educationTypeFilter = signal('');
  readonly specialtyFilter = signal('');
  readonly userRole = signal<UserRole | undefined>(undefined);

  /** Read-only consultation — school no longer validates merchant payments. */
  readonly displayedColumns = [
    'type',
    'school',
    'educationType',
    'specialty',
    'amount',
    'student',
    'declaredAt',
    'deadline',
    'status',
  ];
  readonly educationTypeI18n = EDUCATION_TYPE_I18N;

  ngOnInit(): void {
    this.store
      .select(selectUser)
      .pipe(
        filter((u): u is User => !!u),
        take(1),
      )
      .subscribe((u) => {
        this.userRole.set(u.role);
        this.load();
      });
  }

  load(): void {
    this.loading.set(true);
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

  educationTypeI18nKey(type: Payment['classEducationType']): string {
    return this.educationTypeI18n[type];
  }
}
