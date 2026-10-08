import { Component, ChangeDetectionStrategy, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { SkeletonTableComponent } from '../../shared/components/skeleton-table/skeleton-table.component';
import { academicYearOf, selectableAcademicYears } from '../../shared/utils/academic-year';
import { CentsPipe } from '../shared/cents.pipe';
import { ParentEnrollment } from '../domain/models';
import { ParentEnrollmentsService } from '../services/parent-enrollments.service';

type TuitionFilter = 'all' | 'settled' | 'owing';

/**
 * The account's students (a parent's children): accepted enrollments with the
 * enrollment fee status, tuition paid and what remains (mobile "My
 * students"). Academic year (current by default) is filtered by the API;
 * class and settled tuition on the page, a parent having few students.
 */
@Component({
  selector: 'app-parent-students',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatSelectModule,
    TranslateModule,
    PageHeaderComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    SkeletonTableComponent,
    CentsPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './students.component.html',
  styleUrl: './students.component.scss',
})
export class StudentsComponent implements OnInit {
  private readonly enrollmentsService = inject(ParentEnrollmentsService);
  private readonly router = inject(Router);

  readonly years = selectableAcademicYears();
  readonly year = signal(academicYearOf(new Date()));
  readonly classId = signal('');
  readonly tuition = signal<TuitionFilter>('all');

  readonly loading = signal(true);
  readonly failed = signal(false);
  private readonly students = signal<ParentEnrollment[]>([]);

  /** Class options from this year's students, so they always match. */
  readonly classes = computed(() => {
    const byId = new Map<string, string>();
    for (const e of this.students()) {
      if (e.offering) byId.set(e.offering.id, `${e.offering.label} · ${e.schoolName}`);
    }
    return [...byId.entries()].map(([id, label]) => ({ id, label }));
  });

  readonly rows = computed(() =>
    this.students().filter((e) => {
      if (this.classId() && e.offering?.id !== this.classId()) return false;
      const settled = e.balance?.tuitionSettled;
      if (this.tuition() === 'settled') return settled === true;
      if (this.tuition() === 'owing') return settled === false;
      return true;
    }),
  );

  ngOnInit(): void {
    this.load();
  }

  onYear(year: string): void {
    this.year.set(year);
    this.classId.set('');
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.enrollmentsService.list(this.year() || undefined).subscribe({
      // A student is an accepted request; pending and refused ones stay in "My requests".
      next: (items) => {
        this.students.set(items.filter((e) => e.status === 'active'));
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  findSchool(): void {
    void this.router.navigate(['/parent/schools']);
  }
}
