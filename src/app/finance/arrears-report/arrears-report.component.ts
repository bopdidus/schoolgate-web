import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FinanceService } from '../finance.service';
import { ArrearsReport, ArrearsRow } from '../finance.model';
import { SchoolService } from '../../schools/school.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SkeletonTableComponent } from '../../shared/components/skeleton-table/skeleton-table.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { XafCurrencyPipe } from '../../shared/pipes/xaf-currency.pipe';
import { selectUser } from '../../core/store/auth.reducer';
import { NotificationService } from '../../core/services/notification.service';
import { academicYearOf, selectableAcademicYears } from '../../shared/utils/academic-year';
import { fileSlug, isoDay, saveBlob } from '../../shared/utils/download';

interface ClassOption {
  id: string;
  label: string;
}

@Component({
  selector: 'app-arrears-report',
  standalone: true,
  imports: [
    RouterLink,
    TranslateModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    PageHeaderComponent,
    SkeletonTableComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    XafCurrencyPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './arrears-report.component.html',
  styleUrl: './arrears-report.component.scss',
})
export class ArrearsReportComponent implements OnInit {
  private readonly finance = inject(FinanceService);
  private readonly schoolService = inject(SchoolService);
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  private readonly notification = inject(NotificationService);

  readonly academicYears = selectableAcademicYears();
  readonly schoolId = signal<string | null>(null);
  readonly classes = signal<ClassOption[]>([]);
  /** Empty = every class. */
  readonly classFilter = signal('');
  readonly academicYearFilter = signal(academicYearOf(new Date()));
  readonly asOf = signal(isoDay());

  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly exporting = signal(false);
  readonly report = signal<ArrearsReport | null>(null);
  readonly page = signal(0);
  readonly pageSize = signal(20);

  readonly columns = ['student', 'class', 'parent', 'installment', 'daysLate', 'due', 'paid', 'outstanding'];

  ngOnInit(): void {
    this.store
      .select(selectUser)
      .pipe(take(1))
      .subscribe((user) => {
        const id = user?.role === 'admin' ? this.route.snapshot.queryParamMap.get('school_id') : user?.schoolId;
        this.schoolId.set(id ? String(id) : null);
        this.loadClasses();
        this.load();
      });
  }

  load(): void {
    const id = this.schoolId();
    if (!id) {
      this.failed.set(true);
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.failed.set(false);
    this.finance.getArrears(id, { ...this.filters(), page: this.page() + 1, pageSize: this.pageSize() }).subscribe({
      next: (report) => {
        this.report.set(report);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  onClassChange(value: string): void {
    this.classFilter.set(value);
    this.reset();
  }

  onYearChange(value: string): void {
    this.academicYearFilter.set(value);
    this.reset();
  }

  onAsOfChange(value: string): void {
    if (!value) return;
    this.asOf.set(value);
    this.reset();
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  /** Exports exactly what the filters show, every page. */
  exportExcel(): void {
    const id = this.schoolId();
    if (!id) return;
    this.exporting.set(true);
    const scope = this.classes().find((c) => c.id === this.classFilter())?.label ?? this.translate.instant('ARREARS.ALL_CLASSES');
    this.finance.exportArrears(id, this.filters()).subscribe({
      next: (blob) => {
        this.exporting.set(false);
        saveBlob(blob, `${this.translate.instant('ARREARS.FILE_NAME')}-${fileSlug(scope)}-${this.asOf()}.xlsx`);
      },
      error: () => {
        this.exporting.set(false);
        this.notification.error('FINANCE.EXPORT_ERROR');
      },
    });
  }

  trackById(_: number, r: ArrearsRow): string {
    return r.enrollmentId;
  }

  private filters() {
    return {
      schoolClassId: this.classFilter() || undefined,
      academicYear: this.academicYearFilter() || undefined,
      asOf: this.asOf() || undefined,
    };
  }

  private reset(): void {
    this.page.set(0);
    this.load();
  }

  private loadClasses(): void {
    const id = this.schoolId();
    if (!id) return;
    this.schoolService.getById(id).subscribe({
      next: (school) =>
        this.classes.set(
          school.classes
            .filter((c) => !!c.id)
            .map((c) => ({
              id: String(c.id),
              label: [c.levelLabel || c.name, c.specialtyOther].filter(Boolean).join(' — '),
            })),
        ),
      error: () => this.classes.set([]),
    });
  }
}
