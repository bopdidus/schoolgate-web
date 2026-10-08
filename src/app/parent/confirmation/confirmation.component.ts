import { Component, ChangeDetectionStrategy, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SkeletonTableComponent } from '../../shared/components/skeleton-table/skeleton-table.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { StatusColorPipe } from '../../shared/pipes/status-color.pipe';
import { CentsPipe } from '../shared/cents.pipe';
import { ParentEnrollment, ParentPayment } from '../domain/models';
import { ParentEnrollmentsService } from '../services/parent-enrollments.service';
import { ParentPaymentsService } from '../services/parent-payments.service';

/**
 * After a request or a payment (mobile confirmation screen): what was done,
 * the payments of the enrollment as a receipt, then back home or to the
 * request.
 */
@Component({
  selector: 'app-parent-confirmation',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    TranslateModule,
    SkeletonTableComponent,
    ErrorStateComponent,
    StatusColorPipe,
    CentsPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirmation.component.html',
  styleUrl: './confirmation.component.scss',
})
export class ConfirmationComponent implements OnInit {
  /** Route parameter `:id` (the enrollment). */
  readonly id = input.required<string>();

  private readonly enrollmentsService = inject(ParentEnrollmentsService);
  private readonly paymentsService = inject(ParentPaymentsService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly enrollment = signal<ParentEnrollment | null>(null);
  readonly payments = signal<ParentPayment[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    forkJoin({
      enrollment: this.enrollmentsService.getById(this.id()),
      payments: this.paymentsService.forEnrollment(this.id()).pipe(catchError(() => of([] as ParentPayment[]))),
    }).subscribe({
      next: ({ enrollment, payments }) => {
        this.enrollment.set(enrollment);
        this.payments.set(payments);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  paymentLabel(p: ParentPayment): string {
    return p.type === 'enrollment_fee'
      ? this.translate.instant('PARENT.ENROLLMENT_FEE')
      : this.translate.instant('PARENT.INSTALLMENT_N', { n: p.installmentNumber ?? '' });
  }
}
