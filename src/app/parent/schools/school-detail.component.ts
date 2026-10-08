import { Component, ChangeDetectionStrategy, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { SkeletonTableComponent } from '../../shared/components/skeleton-table/skeleton-table.component';
import { LocaleDatePipe } from '../../shared/pipes/locale-date.pipe';
import { CentsPipe } from '../shared/cents.pipe';
import { ClassOffering, DocumentRequirement, ParentSchool } from '../domain/models';
import { ParentSchoolsService } from '../services/parent-schools.service';

/**
 * A school's page (mobile school details): contact, classes with fees,
 * installments and seats, required documents; request a place, or pay the
 * tuition of a returning student.
 */
@Component({
  selector: 'app-parent-school-detail',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    TranslateModule,
    PageHeaderComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    SkeletonTableComponent,
    LocaleDatePipe,
    CentsPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './school-detail.component.html',
  styleUrl: './school-detail.component.scss',
})
export class SchoolDetailComponent implements OnInit {
  /** Route parameter `:id` (component input binding). */
  readonly id = input.required<string>();

  private readonly schoolsService = inject(ParentSchoolsService);

  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly school = signal<ParentSchool | null>(null);
  readonly requirements = signal<DocumentRequirement[]>([]);

  /** Requests are refused once the school's enrollment deadline has passed. */
  readonly enrollmentOpen = computed(() => {
    const deadline = this.school()?.enrollmentDeadline;
    return !deadline || new Date(deadline).getTime() >= Date.now();
  });

  readonly enrollmentDocs = computed(() => this.requirements().filter((r) => r.purpose === 'enrollment'));
  readonly tuitionDocs = computed(() => this.requirements().filter((r) => r.purpose === 'tuition_payment'));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    forkJoin({
      school: this.schoolsService.getById(this.id()),
      requirements: this.schoolsService.documentRequirements(this.id()).pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ school, requirements }) => {
        this.school.set(school);
        this.requirements.set(requirements);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  tuitionTotal(c: ClassOffering): number {
    return c.installments.reduce((sum, i) => sum + i.amountCents, 0);
  }

  docLabel(r: DocumentRequirement): string {
    return r.otherLabel || r.documentType.label;
  }
}
