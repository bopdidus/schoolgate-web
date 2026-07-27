import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { SchoolRepository } from '../../../infrastructure/school.repository';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { NotificationService } from '../../../../../core/notifications/notification.service';
import { HasUnsavedChanges } from '../../../../../core/guards/unsaved-changes.guard';
import { CreateSchoolRequest, School, UpdateSchoolRequest } from '../../../domain/models/school.model';
import { SchoolSystem } from '../../../../../shared/models/common.model';
import {
  SCHOOL_SYSTEM_I18N,
  SCHOOL_SYSTEMS,
} from '../../../../../shared/constants/education-system.constants';
import { CityAutocompleteComponent } from '../../../../../shared/components/city-autocomplete/city-autocomplete.component';

@Component({
  selector: 'app-school-form-page',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatCardModule,
    TranslateModule,
    PageHeaderComponent,
    CityAutocompleteComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './school-form-page.component.html',
  styleUrl: './school-form-page.component.scss',
})
export class SchoolFormPageComponent implements OnInit, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly repository = inject(SchoolRepository);
  private readonly notification = inject(NotificationService);

  readonly isEdit = signal(false);
  readonly saving = signal(false);
  readonly schoolId = signal<string | null>(null);
  readonly schoolSystemOptions = SCHOOL_SYSTEMS;
  readonly schoolSystemI18n = SCHOOL_SYSTEM_I18N;

  private formDirty = false;

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    cityId: [null as number | null, Validators.required],
    address: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    status: ['active' as 'active' | 'inactive', Validators.required],
    system: ['francophone' as SchoolSystem, Validators.required],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.schoolId.set(id);
      this.repository.getById(id).subscribe((school) => this.patchForm(school));
    }
    this.form.valueChanges.subscribe(() => {
      this.formDirty = true;
    });
  }

  hasUnsavedChanges(): boolean {
    return this.formDirty && this.form.dirty;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    if (raw.cityId == null) {
      this.form.controls.cityId.markAsTouched();
      return;
    }

    this.saving.set(true);
    const request: CreateSchoolRequest = {
      name: raw.name,
      cityId: raw.cityId,
      address: raw.address,
      phone: raw.phone,
      email: raw.email,
      status: raw.status,
      system: raw.system,
    };

    const op = this.isEdit()
      ? this.repository.update(this.schoolId()!, request as UpdateSchoolRequest)
      : this.repository.create(request);

    op.subscribe({
      next: (school) => {
        this.formDirty = false;
        this.notification.success('COMMON.SUCCESS');
        if (this.isEdit()) {
          void this.router.navigate(['/schools', school.id]);
        } else {
          void this.router.navigate(['/schools', school.id, 'classes', 'new']);
        }
      },
      error: () => {
        this.saving.set(false);
        this.notification.error('COMMON.ERROR');
      },
    });
  }

  private patchForm(school: School): void {
    this.form.patchValue({
      name: school.name,
      cityId: school.cityId || null,
      address: school.address,
      phone: school.phone,
      email: school.email,
      status: school.status,
      system: school.schoolSystem,
    });
    this.formDirty = false;
  }
}
