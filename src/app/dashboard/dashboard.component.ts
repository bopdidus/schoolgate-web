import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { DashboardService } from './dashboard.service';
import {
  DashboardStats,
  ClassPaymentStats,
  EnrollmentTrend,
  DashboardRecentPayment,
} from './dashboard.model';
import { PaymentService } from '../payments/payment.service';
import { PageHeaderComponent } from '../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../shared/components/stat-card/stat-card.component';
import { ErrorStateComponent } from '../shared/components/error-state/error-state.component';
import { XafCurrencyPipe } from '../shared/pipes/xaf-currency.pipe';
import { StatusColorPipe } from '../shared/pipes/status-color.pipe';
import { LocaleDatePipe } from '../shared/pipes/locale-date.pipe';
import { selectUser } from '../core/store/auth.reducer';
import { NotificationService } from '../core/services/notification.service';
import { ThemeService } from '../core/services/theme.service';
import { resolveCssColor, withAlpha } from '../core/utils/css-color.util';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    AsyncPipe,
    TranslateModule,
    MatIconModule,
    MatTableModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    NgChartsModule,
    PageHeaderComponent,
    StatCardComponent,
    ErrorStateComponent,
    XafCurrencyPipe,
    StatusColorPipe,
    LocaleDatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly paymentService = inject(PaymentService);
  private readonly notification = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly theme = inject(ThemeService);
  private readonly store = inject(Store);

  readonly user$ = this.store.select(selectUser);
  readonly loading = signal(true);
  /** Distinguishes "request failed" from "no data", which used to look identical. */
  readonly failed = signal(false);
  readonly stats = signal<DashboardStats | null>(null);
  readonly recentPayments = signal<DashboardRecentPayment[]>([]);
  readonly classStats = signal<ClassPaymentStats[]>([]);
  readonly enrollmentTrend = signal<EnrollmentTrend[]>([]);

  /** Charts render nothing useful with an empty series — guard rather than draw an empty canvas. */
  readonly hasClassStats = computed(() => this.classStats().length > 0);
  readonly hasTrend = computed(() => this.enrollmentTrend().length > 0);

  barChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  trendChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };

  barChartOptions: ChartConfiguration<'bar'>['options'] = {};
  trendChartOptions: ChartConfiguration<'line'>['options'] = {};

  readonly paymentColumns = ['student', 'amount', 'status', 'declaredAt', 'actions'];

  constructor() {
    // Charts are drawn to a canvas, so they cannot inherit CSS. Re-derive their
    // palette whenever the theme changes, or a dark-mode dashboard keeps the
    // light-mode colours.
    effect(() => {
      this.theme.resolved();
      this.applyChartOptions();
      this.applyChartData();
    });

    this.translate.onLangChange.pipe(takeUntilDestroyed()).subscribe(() => this.applyChartData());
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.dashboardService.getOverview().subscribe({
      next: (overview) => {
        this.stats.set(overview.stats);
        this.classStats.set(overview.classPaymentStats ?? []);
        this.enrollmentTrend.set(overview.enrollmentTrend ?? []);
        this.recentPayments.set(overview.recentPayments ?? []);
        this.applyChartData();
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  // ── Chart theming ─────────────────────────────────────────────────────────

  private palette() {
    return {
      primary: resolveCssColor('--mat-sys-primary'),
      tertiary: resolveCssColor('--mat-sys-tertiary'),
      onSurface: resolveCssColor('--mat-sys-on-surface-variant'),
      grid: resolveCssColor('--mat-sys-outline-variant'),
    };
  }

  private applyChartOptions(): void {
    const c = this.palette();
    const legend = {
      position: 'bottom' as const,
      labels: { color: c.onSurface, usePointStyle: true, boxWidth: 8, padding: 16 },
    };
    const scales = {
      x: { grid: { display: false }, ticks: { color: c.onSurface }, border: { color: c.grid } },
      y: {
        beginAtZero: true,
        grid: { color: c.grid },
        ticks: { color: c.onSurface, precision: 0 },
        border: { display: false },
      },
    };

    this.barChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend },
      scales,
    };

    this.trendChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      elements: { line: { tension: 0.35 }, point: { radius: 0, hitRadius: 12 } },
      scales,
    };
  }

  private applyChartData(): void {
    const c = this.palette();

    const classData = this.classStats();
    this.barChartData = {
      labels: classData.map((d) => d.className),
      datasets: [
        {
          label: this.translate.instant('STATUS.VALIDATED'),
          data: classData.map((d) => d.validated),
          backgroundColor: c.primary,
          borderRadius: 6,
          maxBarThickness: 28,
        },
        {
          label: this.translate.instant('STATUS.PENDING'),
          data: classData.map((d) => d.pending),
          backgroundColor: c.tertiary,
          borderRadius: 6,
          maxBarThickness: 28,
        },
      ],
    };

    const trend = this.enrollmentTrend();
    this.trendChartData = {
      labels: trend.map((d) => d.date),
      datasets: [
        {
          label: this.translate.instant('DASHBOARD.ENROLLMENTS_OVER_TIME'),
          data: trend.map((d) => d.count),
          borderColor: c.primary,
          backgroundColor: withAlpha(c.primary, 0.14),
          fill: true,
          borderWidth: 2,
        },
      ],
    };
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  validatePayment(payment: DashboardRecentPayment): void {
    this.paymentService.validate({ payment_ids: [payment.id] }).subscribe({
      next: () => {
        this.notification.success('PAYMENTS.VALIDATED_OK');
        this.loadDashboard();
      },
    });
  }

  rejectPayment(payment: DashboardRecentPayment): void {
    this.paymentService.reject({ payment_ids: [payment.id] }).subscribe({
      next: () => {
        this.notification.success('PAYMENTS.REJECTED_OK');
        this.loadDashboard();
      },
    });
  }

  trackById(_: number, p: DashboardRecentPayment): string {
    return p.id;
  }

  /** Initials for the recent-payments table avatar, e.g. "Emily Davis" → "ED". */
  initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    const letters = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0];
    return letters.toUpperCase();
  }

  /** First token of the display name, for the "Welcome, {name}!" greeting. */
  firstName(name: string | null | undefined): string {
    return (name ?? '').trim().split(/\s+/)[0] ?? '';
  }
}
