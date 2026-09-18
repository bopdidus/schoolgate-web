import { Component, inject, input, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { EnrollmentService } from '../../enrollments/enrollment.service';
import { Enrollment } from '../../enrollments/enrollment.model';
import { SkeletonTableComponent } from '../../shared/components/skeleton-table/skeleton-table.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusColorPipe } from '../../shared/pipes/status-color.pipe';
import { LocaleDatePipe } from '../../shared/pipes/locale-date.pipe';
import { NotificationService } from '../../core/services/notification.service';
import { AbilityService } from '../../core/services/ability.service';
import { ACTIONABLE_ENROLLMENT_STATUSES, EducationSystem } from '../../shared/models/common.model';
import { EDUCATION_SYSTEM_I18N } from '../../shared/constants/education-system.constants';
import { RejectReasonDialogComponent } from '../../enrollments/reject-reason-dialog/reject-reason-dialog.component';
import { EnrollmentDetailDialogComponent } from '../../enrollments/enrollment-detail-dialog/enrollment-detail-dialog.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogResult,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-school-enrollments-panel',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    TranslateModule,
    SkeletonTableComponent,
    EmptyStateComponent,
    StatusColorPipe,
    LocaleDatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './school-enrollments-panel.component.html',
  styleUrl: './school-enrollments-panel.component.scss',
})
export class SchoolEnrollmentsPanelComponent implements OnInit {
  readonly schoolId = input.required<string>();

  private readonly enrollmentService = inject(EnrollmentService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly abilities = inject(AbilityService);

  readonly loading = signal(true);
  readonly actionLoading = signal<string | null>(null);
  readonly enrollments = signal<Enrollment[]>([]);
  readonly total = signal(0);
  readonly page = signal(0);
  readonly pageSize = signal(10);
  readonly activeTab = signal(0);
  /** '' = all, 'true' = returning (ancien), 'false' = new (nouveau) — server-side filter. */
  readonly returningStudentFilter = signal<'' | 'true' | 'false'>('');

  readonly enrolledColumns = ['student', 'class', 'status', 'date', 'actions'];
  readonly requestColumns = ['student', 'class', 'status', 'date', 'actions'];
  readonly educationSystemI18n = EDUCATION_SYSTEM_I18N;

  ngOnInit(): void {
    this.load();
  }

  onTabChange(index: number): void {
    this.activeTab.set(index);
    this.page.set(0);
    this.load();
  }

  /** Role *and* scope: staff may only decide on their own school's requests. */
  canActOnEnrollment(e: Enrollment): boolean {
    return (
      this.abilities.can('decide', 'Enrollment', { schoolId: e.schoolId }) &&
      (ACTIONABLE_ENROLLMENT_STATUSES as string[]).includes(e.status)
    );
  }

  load(): void {
    this.loading.set(true);
    const isEnrolledTab = this.activeTab() === 0;

    this.enrollmentService
      .getAll({
        schoolId: this.schoolId(),
        paymentValidated: isEnrolledTab ? true : undefined,
        status: isEnrolledTab ? '' : undefined,
        isReturningStudent:
          this.returningStudentFilter() === '' ? undefined : this.returningStudentFilter() === 'true',
        page: this.page() + 1,
        pageSize: this.pageSize(),
      })
      .subscribe({
        next: (r) => {
          const rows = isEnrolledTab
            ? r.data
            : r.data.filter((e) =>
                (ACTIONABLE_ENROLLMENT_STATUSES as string[]).includes(e.status),
              );
          this.enrollments.set(rows);
          this.total.set(isEnrolledTab ? r.total : rows.length);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  openDetail(enrollment: Enrollment): void {
    this.dialog
      .open(EnrollmentDetailDialogComponent, {
        width: '520px',
        data: { id: enrollment.id, enrollment },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result?.accepted || result?.rejected) {
          this.load();
        }
      });
  }

  accept(e: Enrollment, event: Event): void {
    event.stopPropagation();
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
        this.actionLoading.set(e.id);
        this.enrollmentService.accept(e.id).subscribe({
          next: () => {
            this.actionLoading.set(null);
            this.notification.success('ENROLLMENTS.ACCEPTED_OK');
            this.load();
          },
          error: () => {
            this.actionLoading.set(null);
            this.notification.error('COMMON.ERROR');
          },
        });
      });
  }

  openRejectDialog(e: Enrollment, event: Event): void {
    event.stopPropagation();
    const ref = this.dialog.open(RejectReasonDialogComponent, {
      width: '420px',
      data: { studentName: e.studentName },
    });
    ref.afterClosed().subscribe((reason: string | undefined) => {
      if (!reason) return;
      this.actionLoading.set(e.id);
      this.enrollmentService.reject(e.id, { reason }).subscribe({
        next: () => {
          this.actionLoading.set(null);
          this.notification.success('ENROLLMENTS.REJECTED_OK');
          this.load();
        },
        error: () => {
          this.actionLoading.set(null);
          this.notification.error('COMMON.ERROR');
        },
      });
    });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  onReturningStudentFilterChange(value: '' | 'true' | 'false'): void {
    this.returningStudentFilter.set(value);
    this.page.set(0);
    this.load();
  }

  trackById(_: number, e: Enrollment): string {
    return e.id;
  }

  systemI18nKey(system: EducationSystem): string {
    return this.educationSystemI18n[system];
  }
}
