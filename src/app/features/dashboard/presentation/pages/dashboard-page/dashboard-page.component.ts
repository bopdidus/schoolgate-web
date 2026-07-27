import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { DashboardRepository } from '../../../infrastructure/dashboard.repository';
import {
  DashboardStats,
  ClassPaymentStats,
  LastRegisteredSchool,
  ApproachingDeadlinePayment,
} from '../../../domain/models/dashboard.model';
import { Payment } from '../../../../payments/domain/models/payment.model';
import { PaymentRepository } from '../../../../payments/infrastructure/payment.repository';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { XafCurrencyPipe } from '../../../../../shared/pipes/xaf-currency.pipe';
import { StatusColorPipe } from '../../../../../shared/pipes/status-color.pipe';
import { LocaleDatePipe } from '../../../../../shared/pipes/locale-date.pipe';
import { selectUser } from '../../../../../core/auth/store/auth.reducer';
import { NotificationService } from '../../../../../core/notifications/notification.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    AsyncPipe,
    DecimalPipe,
    RouterLink,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCardModule,
    MatListModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    NgChartsModule,
    PageHeaderComponent,
    XafCurrencyPipe,
    StatusColorPipe,
    LocaleDatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-page.component.html',
})
export class DashboardPageComponent implements OnInit {
  private readonly dashboardRepo = inject(DashboardRepository);
  private readonly paymentRepo = inject(PaymentRepository);
  private readonly notification = inject(NotificationService);
  private readonly store = inject(Store);

  readonly user$ = this.store.select(selectUser);
  readonly loading = signal(true);
  readonly stats = signal<DashboardStats | null>(null);
  readonly lastRegisteredSchool = signal<LastRegisteredSchool | null>(null);
  readonly recentPayments = signal<Payment[]>([]);
  readonly classStats = signal<ClassPaymentStats[]>([]);
  readonly approachingDeadlinePayments = signal<ApproachingDeadlinePayment[]>([]);

  barChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
  };

  readonly paymentColumns = ['student', 'amount', 'status', 'actions'];

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.dashboardRepo.getOverview().subscribe({
      next: (overview) => {
        this.stats.set(overview.stats);
        this.lastRegisteredSchool.set(overview.lastRegisteredSchool ?? null);
        this.classStats.set(overview.classPaymentStats ?? []);
        this.recentPayments.set(overview.recentPayments ?? []);
        this.approachingDeadlinePayments.set(overview.approachingDeadlinePayments ?? []);
        this.applyChartData(overview);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private applyChartData(overview: { classPaymentStats?: ClassPaymentStats[] }): void {
    const classData = overview.classPaymentStats ?? [];
    this.barChartData = {
      labels: classData.map((d) => d.className),
      datasets: [
        { label: 'Validated', data: classData.map((d) => d.validated), backgroundColor: '#2ECC71' },
        { label: 'Pending', data: classData.map((d) => d.pending), backgroundColor: '#3498DB' },
      ],
    };
  }

  validatePayment(payment: Payment): void {
    this.paymentRepo.validate({ payment_ids: [payment.id] }).subscribe({
      next: () => {
        this.notification.success('Payment validated');
        this.loadDashboard();
      },
    });
  }

  rejectPayment(payment: Payment): void {
    this.paymentRepo.reject({ payment_ids: [payment.id] }).subscribe({
      next: () => {
        this.notification.success('Payment rejected');
        this.loadDashboard();
      },
    });
  }

  trackById(_: number, p: Payment): string {
    return p.id;
  }
}
