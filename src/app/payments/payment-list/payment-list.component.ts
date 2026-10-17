import { DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { filter, finalize, Observable, take } from 'rxjs';
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
import { ActivatedRoute } from '@angular/router';
import { PaymentService } from '../payment.service';
import { Payment } from '../payment.model';
import { User } from '../../core/models/auth.model';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SkeletonTableComponent } from '../../shared/components/skeleton-table/skeleton-table.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { StatusColorPipe } from '../../shared/pipes/status-color.pipe';
import { XafCurrencyPipe } from '../../shared/pipes/xaf-currency.pipe';
import { LocaleDatePipe } from '../../shared/pipes/locale-date.pipe';
import { PAYMENT_DEADLINE_URGENT_HOURS } from '../../shared/constants/payment.constants';
import { selectUser } from '../../core/store/auth.reducer';
import { EDUCATION_TYPE_I18N } from '../../shared/constants/education-system.constants';
import { ManualPaymentReview } from '../manual-payment-review.service';
import { AbilityService } from '../../core/services/ability.service';

/** Status filter value for manual payments waiting for the school. */
const TO_CONFIRM = 'to_confirm';

@Component({
  selector: 'app-payment-list',
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
    ErrorStateComponent,
    StatusColorPipe,
    XafCurrencyPipe,
    LocaleDatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment-list.component.html',
  styleUrl: './payment-list.component.scss',
})
export class PaymentListComponent implements OnInit {
  private readonly paymentService = inject(PaymentService);
  private readonly store = inject(Store);
  private readonly manualReview = inject(ManualPaymentReview);
  private readonly abilities = inject(AbilityService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(true);
  /** Separates a failed request from a genuinely empty list. */
  readonly failed = signal(false);
  readonly payments = signal<Payment[]>([]);
  readonly total = signal(0);
  readonly page = signal(0);
  readonly pageSize = signal(10);
  readonly statusFilter = signal('');
  readonly educationTypeFilter = signal('');
  readonly specialtyFilter = signal('');
  /** Payment ids with a confirm/reject request in flight. */
  readonly busy = signal<ReadonlySet<string>>(new Set());
  readonly toConfirm = TO_CONFIRM;

  /**
   * Operator payments settle on their own; manual ones (paid by hand to the
   * school) wait for its staff, who confirm or reject them here.
   */
  readonly displayedColumns = [
    'type',
    'school',
    'educationType',
    'specialty',
    'amount',
    'student',
    'reference',
    'declaredAt',
    'deadline',
    'status',
    'actions',
  ];
  readonly educationTypeI18n = EDUCATION_TYPE_I18N;

  ngOnInit(): void {
    const status = this.route.snapshot.queryParamMap.get('status');
    if (status) this.statusFilter.set(status);
    this.store
      .select(selectUser)
      .pipe(
        filter((u): u is User => !!u),
        take(1),
      )
      .subscribe(() => {
        this.load();
      });
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.paymentService
      .getAll({
        status: this.statusFilter() === TO_CONFIRM ? 'declared' : (this.statusFilter() as Payment['status'] | ''),
        manual: this.statusFilter() === TO_CONFIRM ? true : undefined,
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
        error: () => {
          this.failed.set(true);
          this.loading.set(false);
        },
      });
  }

  /** Only school staff can vouch for money on the school's account. */
  canReview(p: Payment): boolean {
    return p.manual && p.status === 'declared' && this.abilities.can('decide', 'Payment');
  }

  isBusy(p: Payment): boolean {
    return this.busy().has(p.id);
  }

  confirm(p: Payment): void {
    this.review(p, this.manualReview.confirm(p.id, () => this.setBusy(p.id, true)));
  }

  reject(p: Payment): void {
    this.review(p, this.manualReview.reject(p.id, () => this.setBusy(p.id, true)));
  }

  private review(p: Payment, done: Observable<void>): void {
    done.pipe(finalize(() => this.setBusy(p.id, false))).subscribe(() => this.load());
  }

  private setBusy(id: string, on: boolean): void {
    this.busy.update((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
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
