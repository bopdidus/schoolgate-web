import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { SchoolService } from '../../schools/school.service';
import { PaymentChannelReview, PaymentChannelStatus } from '../../schools/school.model';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SkeletonTableComponent } from '../../shared/components/skeleton-table/skeleton-table.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { LocaleDatePipe } from '../../shared/pipes/locale-date.pipe';

/** Statuses an admin looks at: waiting for a decision, waiting for the test, switched off. */
export type PaymentReviewView = Extract<PaymentChannelStatus, 'submitted' | 'approved' | 'suspended'>;

@Component({
  selector: 'app-payment-review-list',
  standalone: true,
  imports: [
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatCardModule,
    TranslateModule,
    PageHeaderComponent,
    SkeletonTableComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    LocaleDatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment-review-list.component.html',
  styleUrl: './payment-review-list.component.scss',
})
export class PaymentReviewListComponent implements OnInit {
  private readonly schoolService = inject(SchoolService);

  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly reviews = signal<PaymentChannelReview[]>([]);
  /** Opens on what still needs a decision. */
  readonly view = signal<PaymentReviewView>('submitted');

  readonly displayedColumns = ['school', 'method', 'submittedAt', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.schoolService.getPaymentChannelReviews(this.view()).subscribe({
      next: (reviews) => {
        this.reviews.set(reviews);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  onViewChange(view: PaymentReviewView): void {
    this.view.set(view);
    this.load();
  }

  trackByKey(_: number, r: PaymentChannelReview): string {
    return r.schoolId + '-' + r.method;
  }
}
