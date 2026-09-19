import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { SchoolService } from '../school.service';
import { SchoolFilters, School } from '../school.model';
import { SchoolStatus } from '../../shared/models/common.model';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SkeletonTableComponent } from '../../shared/components/skeleton-table/skeleton-table.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { StatusColorPipe } from '../../shared/pipes/status-color.pipe';
import {
  EDUCATION_TYPE_I18N,
  SCHOOL_SYSTEM_I18N,
} from '../../shared/constants/education-system.constants';

@Component({
  selector: 'app-school-list',
  standalone: true,
  imports: [
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    TranslateModule,
    PageHeaderComponent,
    SkeletonTableComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    StatusColorPipe,
    UpperCasePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './school-list.component.html',
  styleUrl: './school-list.component.scss',
})
export class SchoolListComponent implements OnInit {
  private readonly schoolService = inject(SchoolService);
  private readonly route = inject(ActivatedRoute);
  private readonly notification = inject(NotificationService);
  readonly router = inject(Router);

  readonly loading = signal(true);
  /** Separates a failed request from a genuinely empty list. */
  readonly failed = signal(false);
  readonly schools = signal<School[]>([]);
  readonly total = signal(0);
  readonly page = signal(0);
  readonly pageSize = signal(10);
  readonly search = signal('');
  /** One status at a time (the API lists a single status); parents only ever see active ones. */
  readonly statusFilter = signal<SchoolStatus>('active');
  /** Id of the school being validated, to disable its button meanwhile. */
  readonly validating = signal<string | null>(null);
  readonly schoolSystemFilter = signal('');
  readonly educationTypeFilter = signal('');
  readonly specialtyFilter = signal('');

  readonly schoolSystemI18n = SCHOOL_SYSTEM_I18N;
  readonly educationTypeI18n = EDUCATION_TYPE_I18N;
  readonly displayedColumns = ['name', 'city', 'academicYear', 'systems', 'classes', 'fillRate', 'status', 'actions'];

  ngOnInit(): void {
    // Seeds the filter from the top-bar quick search (?search=...), which
    // deep-links here rather than duplicating a second search UI.
    const fromQuery = this.route.snapshot.queryParamMap.get('search');
    if (fromQuery) {
      this.search.set(fromQuery);
    }
    // ?status=pending comes from the dashboard card and the bell.
    const status = this.route.snapshot.queryParamMap.get('status');
    if (status === 'active' || status === 'pending' || status === 'inactive') {
      this.statusFilter.set(status);
    }
    this.loadSchools();
  }

  loadSchools(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.schoolService
      .getAll({
        search: this.search(),
        status: this.statusFilter(),
        schoolSystem: this.schoolSystemFilter() as SchoolFilters['schoolSystem'],
        educationType: this.educationTypeFilter() as SchoolFilters['educationType'],
        specialtyId: this.specialtyFilter() || undefined,
        page: this.page() + 1,
        pageSize: this.pageSize(),
      })
      .subscribe({
        next: (response) => {
          this.schools.set(response.data);
          this.total.set(response.total);
          this.loading.set(false);
        },
        error: () => {
          this.failed.set(true);
          this.loading.set(false);
        },
      });
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.page.set(0);
    this.loadSchools();
  }

  onStatusChange(value: SchoolStatus): void {
    this.statusFilter.set(value);
    this.page.set(0);
    this.loadSchools();
  }

  /** Publishes a self-registered school; it then leaves the pending list. */
  validate(school: School): void {
    this.validating.set(school.id);
    this.schoolService.validate(school.id).subscribe({
      next: () => {
        this.validating.set(null);
        this.notification.success('SCHOOLS.VALIDATED_OK');
        this.loadSchools();
      },
      error: () => this.validating.set(null),
    });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadSchools();
  }

  onSchoolSystemChange(value: string): void {
    this.schoolSystemFilter.set(value);
    this.page.set(0);
    this.loadSchools();
  }

  onEducationTypeChange(value: string): void {
    this.educationTypeFilter.set(value);
    this.page.set(0);
    this.loadSchools();
  }

  onSpecialtyChange(value: string): void {
    this.specialtyFilter.set(value);
    this.page.set(0);
    this.loadSchools();
  }

  trackById(_: number, school: School): string {
    return school.id;
  }

  schoolSystemI18nKey(system: School['schoolSystem']): string {
    return this.schoolSystemI18n[system];
  }
}
