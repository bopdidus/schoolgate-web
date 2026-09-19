import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { SchoolService } from '../school.service';
import { School, SchoolClass } from '../school.model';
import { EDUCATION_SYSTEM_I18N, EDUCATION_TYPE_BADGE, EDUCATION_TYPE_I18N, SCHOOL_SYSTEM_I18N } from '../../shared/constants/education-system.constants';
import { EducationType } from '../../shared/models/common.model';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { SkeletonTableComponent } from '../../shared/components/skeleton-table/skeleton-table.component';
import { StatusColorPipe } from '../../shared/pipes/status-color.pipe';
import { EducationTypeColorPipe } from '../../shared/pipes/education-type-color.pipe';
import { XafCurrencyPipe } from '../../shared/pipes/xaf-currency.pipe';
import { LocaleDatePipe } from '../../shared/pipes/locale-date.pipe';
import { AbilityService } from '../../core/services/ability.service';
import { SchoolEnrollmentsPanelComponent } from '../school-enrollments-panel/school-enrollments-panel.component';
import { SchoolDocumentRequirementsPanelComponent } from '../school-document-requirements-panel/school-document-requirements-panel.component';
import { SchoolMatriculeVerificationPanelComponent } from '../school-matricule-verification-panel/school-matricule-verification-panel.component';

@Component({
  selector: 'app-school-detail',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    TranslateModule,
    PageHeaderComponent,
    ErrorStateComponent,
    SkeletonTableComponent,
    StatusColorPipe,
    XafCurrencyPipe,
    LocaleDatePipe,
    SchoolEnrollmentsPanelComponent,
    SchoolDocumentRequirementsPanelComponent,
    SchoolMatriculeVerificationPanelComponent,
    EducationTypeColorPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './school-detail.component.html',
  styleUrl: './school-detail.component.scss',
})
export class SchoolDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly schoolService = inject(SchoolService);
  private readonly abilities = inject(AbilityService);

  readonly loading = signal(true);
  readonly school = signal<School | null>(null);
  readonly educationSystemI18n = EDUCATION_SYSTEM_I18N;
  readonly schoolSystemI18n = SCHOOL_SYSTEM_I18N;
  readonly educationTypeI18n = EDUCATION_TYPE_I18N;
  readonly educationTypeBadge = EDUCATION_TYPE_BADGE;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.schoolService.getById(id).subscribe({
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

  /** Role *and* scope: a school_admin may only manage their own school's classes. */
  canManageClasses(schoolId: string): boolean {
    return this.abilities.can('manage', 'SchoolClass', { schoolId });
  }

  canEditSchool(schoolId: string): boolean {
    return this.abilities.can('update', 'School', { schoolId });
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
