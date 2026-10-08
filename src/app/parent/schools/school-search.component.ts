import { Component, ChangeDetectionStrategy, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, startWith, tap } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { TranslateModule } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { SkeletonTableComponent } from '../../shared/components/skeleton-table/skeleton-table.component';
import { CityAutocompleteComponent } from '../../shared/components/city-autocomplete/city-autocomplete.component';
import { CentsPipe } from '../shared/cents.pipe';
import { LabelRef, ParentSchool } from '../domain/models';
import { ParentSchoolsService } from '../services/parent-schools.service';

type SchoolSort = 'name' | 'seats' | 'tuition';

const PAGE_SIZE = 12;

/** Lowest yearly cost among the school's classes: enrollment fee + tuition. */
function lowestYearlyCost(school: ParentSchool): number | null {
  const costs = school.classes.map(
    (c) => c.enrollmentFeeCents + c.installments.reduce((sum, i) => sum + i.amountCents, 0),
  );
  return costs.length ? Math.min(...costs) : null;
}

function seatsLeft(school: ParentSchool): number {
  return school.classes.reduce((sum, c) => sum + Math.max(c.seatsRemaining, 0), 0);
}

/**
 * Find a school (mobile home screen): search, city, level, system, sort.
 * City, level, system and search are filtered by the API; sorting by seats or
 * cost happens on the page shown.
 */
@Component({
  selector: 'app-parent-school-search',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatPaginatorModule,
    TranslateModule,
    PageHeaderComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    SkeletonTableComponent,
    CityAutocompleteComponent,
    CentsPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './school-search.component.html',
  styleUrl: './school-search.component.scss',
})
export class SchoolSearchComponent implements OnInit {
  private readonly schoolsService = inject(ParentSchoolsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  readonly filters = this.fb.nonNullable.group({
    q: [''],
    cityId: this.fb.control<number | null>(null),
    levelCode: [''],
    system: ['' as '' | 'francophone' | 'anglophone'],
    sort: ['name' as SchoolSort],
  });

  readonly levels = signal<LabelRef[]>([]);
  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly schools = signal<ParentSchool[]>([]);
  readonly total = signal(0);
  readonly page = signal(0);
  private readonly sort = signal<SchoolSort>('name');

  readonly sorted = computed(() => {
    const list = [...this.schools()];
    switch (this.sort()) {
      case 'seats':
        return list.sort((a, b) => seatsLeft(b) - seatsLeft(a));
      case 'tuition':
        return list.sort((a, b) => (lowestYearlyCost(a) ?? Infinity) - (lowestYearlyCost(b) ?? Infinity));
      default:
        return list.sort((a, b) => a.name.localeCompare(b.name));
    }
  });

  readonly seatsLeft = seatsLeft;
  readonly lowestYearlyCost = lowestYearlyCost;

  ngOnInit(): void {
    this.schoolsService.levels().subscribe({ next: (l) => this.levels.set(l), error: () => this.levels.set([]) });

    this.filters.controls.sort.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((s) => this.sort.set(s));

    this.filters.valueChanges
      .pipe(
        startWith(this.filters.getRawValue()),
        debounceTime(300),
        // Sorting alone does not need a new request.
        distinctUntilChanged(
          (a, b) => a.q === b.q && a.cityId === b.cityId && a.levelCode === b.levelCode && a.system === b.system,
        ),
        tap(() => this.page.set(0)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.load());
  }

  onPage(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.load();
  }

  load(): void {
    const v = this.filters.getRawValue();
    this.loading.set(true);
    this.failed.set(false);
    this.schoolsService
      .search({
        q: v.q,
        cityId: v.cityId ?? undefined,
        levelCode: v.levelCode,
        system: v.system || undefined,
        page: this.page() + 1,
        pageSize: PAGE_SIZE,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.schools.set(result.items);
          this.total.set(result.total);
          this.loading.set(false);
        },
        error: () => {
          this.schools.set([]);
          this.failed.set(true);
          this.loading.set(false);
        },
      });
  }

  resetFilters(): void {
    this.filters.reset({ q: '', cityId: null, levelCode: '', system: '', sort: 'name' });
  }

  readonly pageSize = PAGE_SIZE;
}
