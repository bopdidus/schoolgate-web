import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
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
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { EnrollmentService } from '../enrollment.service';
import { Enrollment } from '../enrollment.model';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SkeletonTableComponent } from '../../shared/components/skeleton-table/skeleton-table.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { StatusColorPipe } from '../../shared/pipes/status-color.pipe';
import { LocaleDatePipe } from '../../shared/pipes/locale-date.pipe';
import { NotificationService } from '../../core/services/notification.service';
import { AbilityService } from '../../core/services/ability.service';
import { ACTIONABLE_ENROLLMENT_STATUSES, EducationSystem } from '../../shared/models/common.model';
import { EDUCATION_SYSTEM_I18N, EDUCATION_TYPE_I18N } from '../../shared/constants/education-system.constants';
import { RejectReasonDialogComponent } from '../reject-reason-dialog/reject-reason-dialog.component';
import { EnrollmentDetailDialogComponent } from '../enrollment-detail-dialog/enrollment-detail-dialog.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogResult,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-enrollment-list',
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
    MatInputModule,
    MatSelectModule,
    TranslateModule,
    PageHeaderComponent,
    SkeletonTableComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    StatusColorPipe,
    LocaleDatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './enrollment-list.component.html',
  styleUrl: './enrollment-list.component.scss',
})
export class EnrollmentListComponent implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly abilities = inject(AbilityService);

  readonly loading = signal(true);
  /** Separates a failed request from a genuinely empty list. */
  readonly failed = signal(false);
  readonly actionLoading = signal<string | null>(null);
  readonly enrollments = signal<Enrollment[]>([]);
  readonly total = signal(0);
  readonly page = signal(0);
  readonly pageSize = signal(10);
  readonly activeTab = signal(0);
  readonly educationTypeFilter = signal('');
  readonly specialtyFilter = signal('');
  /** '' = all, 'true' = returning (ancien), 'false' = new (nouveau) — server-side filter. */
  readonly returningStudentFilter = signal<'' | 'true' | 'false'>('');

  readonly enrolledColumns = ['student', 'school', 'class', 'academicYear', 'educationType', 'specialty', 'status', 'date', 'actions'];
  readonly requestColumns = ['student', 'school', 'class', 'academicYear', 'educationType', 'specialty', 'status', 'date', 'actions'];
  readonly educationSystemI18n = EDUCATION_SYSTEM_I18N;
  readonly educationTypeI18n = EDUCATION_TYPE_I18N;

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
    this.failed.set(false);
    const isEnrolledTab = this.activeTab() === 0;

    this.enrollmentService
      .getAll({
        paymentValidated: isEnrolledTab ? true : undefined,
        status: isEnrolledTab ? '' : undefined,
        educationType: this.educationTypeFilter() as Enrollment['classEducationType'] | '',
        specialtyId: this.specialtyFilter() || undefined,
        isReturningStudent:
          this.returningStudentFilter() === '' ? undefined : this.returningStudentFilter() === 'true',
        page: this.page() + 1,
        pageSize: this.pageSize(),
      })
      .subscribe({
        next: (r) => {
          let rows = isEnrolledTab
            ? r.data
            : r.data.filter((e) =>
                (ACTIONABLE_ENROLLMENT_STATUSES as string[]).includes(e.status),
              );
          const educationType = this.educationTypeFilter();
          if (educationType) {
            const normalized =
              educationType === 'professional' ? 'vocational' : educationType;
            rows = rows.filter((e) => e.classEducationType === normalized);
          }
          const specialty = this.specialtyFilter().trim().toLowerCase();
          if (specialty) {
            rows = rows.filter((e) =>
              (e.classSpecialtyLabel ?? '').toLowerCase().includes(specialty),
            );
          }
          this.enrollments.set(rows);
          this.total.set(
            isEnrolledTab && !educationType && !specialty ? r.total : rows.length,
          );
          this.loading.set(false);
        },
        error: () => {
          this.failed.set(true);
          this.loading.set(false);
        },
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

  educationTypeI18nKey(type: Enrollment['classEducationType']): string {
    return this.educationTypeI18n[type];
  }
}
