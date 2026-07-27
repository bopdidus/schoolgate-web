import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { SchoolRepository } from '../../../infrastructure/school.repository';
import { School, SchoolClass } from '../../../domain/models/school.model';
import { EDUCATION_SYSTEM_I18N, EDUCATION_TYPE_BADGE, EDUCATION_TYPE_I18N, SCHOOL_SYSTEM_I18N } from '../../../../../shared/constants/education-system.constants';
import { EducationType, UserRole } from '../../../../../shared/models/common.model';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { SkeletonTableComponent } from '../../../../../shared/components/skeleton-table/skeleton-table.component';
import { StatusColorPipe } from '../../../../../shared/pipes/status-color.pipe';
import { EducationTypeColorPipe } from '../../../../../shared/pipes/education-type-color.pipe';
import { XafCurrencyPipe } from '../../../../../shared/pipes/xaf-currency.pipe';
import { LocaleDatePipe } from '../../../../../shared/pipes/locale-date.pipe';
import { selectUser } from '../../../../../core/auth/store/auth.reducer';
import { SchoolEnrollmentsPanelComponent } from '../../components/school-enrollments-panel/school-enrollments-panel.component';

@Component({
  selector: 'app-school-detail-page',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    TranslateModule,
    PageHeaderComponent,
    SkeletonTableComponent,
    StatusColorPipe,
    XafCurrencyPipe,
    LocaleDatePipe,
    SchoolEnrollmentsPanelComponent,
    EducationTypeColorPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './school-detail-page.component.html',
})
export class SchoolDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly repository = inject(SchoolRepository);
  private readonly store = inject(Store);

  readonly user$ = this.store.select(selectUser);

  readonly loading = signal(true);
  readonly school = signal<School | null>(null);
  readonly educationSystemI18n = EDUCATION_SYSTEM_I18N;
  readonly schoolSystemI18n = SCHOOL_SYSTEM_I18N;
  readonly educationTypeI18n = EDUCATION_TYPE_I18N;
  readonly educationTypeBadge = EDUCATION_TYPE_BADGE;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.repository.getById(id).subscribe({
        next: (school) => {
          this.school.set(school);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  trackById(_: number, item: { id?: string; name: string }): string {
    return item.id ?? item.name;
  }

  canManageClasses(role: UserRole): boolean {
    return role === 'admin' || role === 'school_admin';
  }

  groupedClasses(school: School): { type: EducationType; specialty: string; classes: SchoolClass[] }[] {
    const order: EducationType[] = ['general', 'technical', 'vocational'];
    const groups: { type: EducationType; specialty: string; classes: SchoolClass[] }[] = [];
    for (const type of order) {
      const byType = school.classes.filter((c) => c.educationType === type);
      if (type === 'general') {
        if (byType.length) groups.push({ type, specialty: '', classes: byType });
        continue;
      }
      const specialtyMap = new Map<string, SchoolClass[]>();
      for (const cls of byType) {
        const key = cls.specialtyOther || cls.specialtyId || 'N/A';
        const row = specialtyMap.get(key) ?? [];
        row.push(cls);
        specialtyMap.set(key, row);
      }
      for (const [specialty, classes] of specialtyMap.entries()) {
        groups.push({ type, specialty, classes });
      }
    }
    return groups;
  }
}
