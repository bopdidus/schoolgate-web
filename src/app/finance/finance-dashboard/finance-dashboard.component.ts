import { Component, DestroyRef, inject, OnInit, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { debounceTime, filter, take } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, TooltipItem } from 'chart.js';
import { FinanceService } from '../finance.service';
import { FinancePeriod, FinanceSummary } from '../finance.model';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { formatXaf, XafCurrencyPipe } from '../../shared/pipes/xaf-currency.pipe';
import { selectUser } from '../../core/store/auth.reducer';
import { ThemeService } from '../../core/services/theme.service';
import { HeaderNotificationsService } from '../../core/services/header-notifications.service';
import { NotificationService } from '../../core/services/notification.service';
import { resolveCssColor } from '../../core/utils/css-color.util';
import { saveBlob, isoDay } from '../../shared/utils/download';

/**
 * Categorical slots (dataviz reference palette, validated for CVD separation
 * in both modes). Fixed order: the enrollment fee is always slot 1, installment
 * n always slot n+1, so a colour keeps meaning one fee line.
 */
const SERIES_LIGHT = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];
const SERIES_DARK = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'];

/** Waits for a burst of validations (a parent paying several lines) to settle before reloading. */
const LIVE_RELOAD_DEBOUNCE_MS = 1000;
/** Axis ticks: 1,2 M rather than 1 200 000. */
const COMPACT = new Intl.NumberFormat('fr-CM', { notation: 'compact' });

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    TranslateModule,
    MatCardModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgChartsModule,
    PageHeaderComponent,
    StatCardComponent,
    ErrorStateComponent,
    XafCurrencyPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './finance-dashboard.component.html',
  styleUrl: './finance-dashboard.component.scss',
})
export class FinanceDashboardComponent implements OnInit {
  private readonly finance = inject(FinanceService);
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  private readonly theme = inject(ThemeService);
  private readonly live = inject(HeaderNotificationsService);
  private readonly notification = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly schoolId = signal<string | null>(null);
  readonly period = signal<FinancePeriod>('day');
  readonly summary = signal<FinanceSummary | null>(null);
  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly exporting = signal(false);
  /** Table view of the chart: the accessible reading of the same numbers. */
  readonly showTable = signal(false);

  readonly hasData = computed(() => (this.summary()?.total ?? 0) > 0);

  chartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  chartOptions: ChartConfiguration<'bar'>['options'] = {};

  constructor() {
    // Canvas charts cannot inherit CSS: re-derive colours when the theme flips.
    effect(() => {
      this.theme.resolved();
      this.applyChart();
    });
    this.translate.onLangChange.pipe(takeUntilDestroyed()).subscribe(() => this.applyChart());
  }

  ngOnInit(): void {
    this.store
      .select(selectUser)
      .pipe(take(1))
      .subscribe((user) => {
        // Staff see their own school; an admin arrives from a school page with ?school_id=.
        const id = user?.role === 'admin' ? this.route.snapshot.queryParamMap.get('school_id') : user?.schoolId;
        this.schoolId.set(id ? String(id) : null);
        this.load();
      });

    // Live: every validated payment of this school reloads the figures.
    this.live.events$
      .pipe(
        filter((e) => e.type === 'payment_validated' && this.isThisSchool(e.data?.['school_id'])),
        debounceTime(LIVE_RELOAD_DEBOUNCE_MS),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.load(true));
  }

  load(silent = false): void {
    const id = this.schoolId();
    if (!id) {
      this.loading.set(false);
      this.failed.set(true);
      return;
    }
    if (!silent) this.loading.set(true);
    this.failed.set(false);
    this.finance.getSummary(id, this.period()).subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.applyChart();
        this.loading.set(false);
      },
      error: () => {
        if (!silent) this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  onPeriodChange(period: FinancePeriod): void {
    this.period.set(period);
    this.load();
  }

  exportExcel(): void {
    const id = this.schoolId();
    if (!id) return;
    this.exporting.set(true);
    this.finance.exportSummary(id, this.period()).subscribe({
      next: (blob) => {
        this.exporting.set(false);
        saveBlob(blob, `${this.translate.instant('FINANCE.FILE_NAME')}-${this.period()}-${isoDay()}.xlsx`);
      },
      error: () => {
        this.exporting.set(false);
        this.notification.error('FINANCE.EXPORT_ERROR');
      },
    });
  }

  lineLabel(installment: number | null): string {
    return installment == null
      ? this.translate.instant('FINANCE.ENROLLMENT_FEE')
      : this.translate.instant('FINANCE.INSTALLMENT', { n: installment });
  }

  bucketLabel(start: string): string {
    const d = new Date(start);
    const lang = this.translate.currentLang || 'fr';
    switch (this.period()) {
      case 'month':
        return d.toLocaleDateString(lang, { month: 'short', year: 'numeric' });
      case 'week':
        return this.translate.instant('FINANCE.WEEK_OF', { date: d.toLocaleDateString(lang, { day: 'numeric', month: 'short' }) });
      default:
        return d.toLocaleDateString(lang, { day: 'numeric', month: 'short' });
    }
  }

  private isThisSchool(schoolId: unknown): boolean {
    return schoolId != null && String(schoolId) === this.schoolId();
  }

  private applyChart(): void {
    const s = this.summary();
    const dark = this.theme.resolved() === 'dark';
    const series = dark ? SERIES_DARK : SERIES_LIGHT;
    const surface = resolveCssColor('--mat-sys-surface');
    const ink = resolveCssColor('--mat-sys-on-surface-variant');
    const grid = resolveCssColor('--mat-sys-outline-variant');

    const lines = s ? [null, ...s.installmentNumbers] : [];
    this.chartData = {
      labels: (s?.series ?? []).map((b) => this.bucketLabel(b.start)),
      datasets: lines.map((installment, i) => ({
        label: this.lineLabel(installment),
        data: (s?.series ?? []).map((b) => b.lines.find((l) => l.installment === installment)?.amount ?? 0),
        backgroundColor: series[i % series.length],
        // 2px surface gap between stacked segments.
        borderColor: surface,
        borderWidth: { top: 2, bottom: 0, left: 0, right: 0 },
        borderRadius: 4,
        borderSkipped: 'bottom',
        maxBarThickness: 32,
      })),
    };

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'bottom', labels: { color: ink, usePointStyle: true, boxWidth: 8, padding: 16 } },
        tooltip: {
          callbacks: {
            label: (item: TooltipItem<'bar'>) => `${item.dataset.label}: ${formatXaf(Number(item.raw ?? 0))}`,
            footer: (items: TooltipItem<'bar'>[]) =>
              `${this.translate.instant('FINANCE.TOTAL')}: ${formatXaf(items.reduce((sum, it) => sum + Number(it.raw ?? 0), 0))}`,
          },
        },
      },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { color: ink }, border: { color: grid } },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: { color: grid },
          border: { display: false },
          ticks: { color: ink, callback: (v) => COMPACT.format(Number(v)) },
        },
      },
    };
  }
}
