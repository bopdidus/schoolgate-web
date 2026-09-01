import {
  Component,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { catchError, concatMap, from, map, of, toArray } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';
import { SchoolRepository } from '../../../infrastructure/school.repository';
import {
  ClassCsvImportService,
  ClassCsvRowResult,
} from '../../../application/class-csv-import.service';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { NotificationService } from '../../../../../core/notifications/notification.service';
import { HasUnsavedChanges } from '../../../../../core/guards/unsaved-changes.guard';
import { School, SchoolClass } from '../../../domain/models/school.model';
import { EducationSystem, EducationType } from '../../../../../shared/models/common.model';
import {
  EDUCATION_SYSTEM_I18N,
  EDUCATION_TYPE_I18N,
  EDUCATION_TYPES,
} from '../../../../../shared/constants/education-system.constants';
import {
  validateFeesChronological,
  toUtcMidnightIso,
} from '../../../application/school-form.validation';
import { RefLevel, RefRepository, RefSpecialty } from '../../../../../core/ref/ref.repository';

interface ClassRawValue {
  system: EducationSystem;
  educationType: EducationType;
  specialtyId: string;
  specialtyOther: string;
  levelId: string;
  name: string;
  totalSeats: number;
  /** Enrollment-fee advance (class-level). */
  advanceAllowed: boolean;
  enrollmentFee: { amount: number; dueDate: string | Date; advancePercentage: number };
  installments: Array<{
    order: number;
    amount: number;
    dueDate: string | Date;
    advanceAllowed: boolean;
    advancePercentage: number;
  }>;
}

@Component({
  selector: 'app-class-form-page',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatCardModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule,
    TranslateModule,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('rowAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-6px)' }),
        animate('180ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('140ms ease-in', style({ opacity: 0, transform: 'translateY(-6px)' })),
      ]),
    ]),
  ],
  templateUrl: './class-form-page.component.html',
  styleUrl: './class-form-page.component.scss',
})
export class ClassFormPageComponent implements OnInit, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly repository = inject(SchoolRepository);
  private readonly refRepository = inject(RefRepository);
  private readonly csvImportService = inject(ClassCsvImportService);
  private readonly notification = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly isEdit = signal(false);
  readonly saving = signal(false);
  readonly loading = signal(true);
  readonly schoolId = signal<string | null>(null);
  readonly classId = signal<string | null>(null);
  readonly schoolName = signal('');
  readonly educationTypeOptions = EDUCATION_TYPES;
  readonly educationTypeI18n = EDUCATION_TYPE_I18N;
  readonly educationSystemI18n = EDUCATION_SYSTEM_I18N;
  readonly specialties = signal<RefSpecialty[]>([]);
  readonly levels = signal<RefLevel[]>([]);
  readonly isBilingual = signal(false);

  readonly csvRows = signal<ClassCsvRowResult[]>([]);
  readonly csvParsing = signal(false);
  readonly csvImporting = signal(false);
  readonly csvSummary = signal<{ success: number; failed: number } | null>(null);

  private school: School | null = null;
  private formDirty = false;

  readonly form = this.createClassGroup();

  ngOnInit(): void {
    this.refRepository.getSpecialties().subscribe((rows) => this.specialties.set(rows));

    const schoolId = this.route.snapshot.paramMap.get('id');
    const classId = this.route.snapshot.paramMap.get('classId');
    if (!schoolId) {
      this.loading.set(false);
      return;
    }

    this.schoolId.set(schoolId);
    if (classId) {
      this.isEdit.set(true);
      this.classId.set(classId);
    }

    this.repository.getById(schoolId).subscribe({
      next: (school) => {
        this.school = school;
        this.schoolName.set(school.name);
        this.isBilingual.set(school.schoolSystem === 'bilingual');

        if (!this.isBilingual()) {
          this.form.controls.system.setValue(
            school.schoolSystem === 'anglophone' ? 'anglophone' : 'francophone',
          );
        }

        if (classId) {
          const existing = school.classes.find((c) => c.id === classId);
          if (existing) {
            this.patchClass(existing);
          } else {
            this.notification.error('COMMON.NOT_FOUND');
            void this.router.navigate(['/schools', schoolId]);
            return;
          }
        }

        this.loadLevels();
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.notification.error('COMMON.ERROR');
      },
    });

    this.form.valueChanges.subscribe(() => {
      this.formDirty = true;
    });
  }

  hasUnsavedChanges(): boolean {
    return this.formDirty && this.form.dirty;
  }

  get installments(): FormArray {
    return this.form.get('installments') as FormArray;
  }

  createClassGroup() {
    return this.fb.nonNullable.group({
      system: ['francophone' as EducationSystem, Validators.required],
      educationType: ['general' as EducationType, Validators.required],
      specialtyId: [''],
      specialtyOther: [''],
      levelId: [{ value: '', disabled: true }, Validators.required],
      name: ['', Validators.required],
      totalSeats: [0, [Validators.required, Validators.min(1)]],
      advanceAllowed: [false],
      enrollmentFee: this.fb.nonNullable.group({
        amount: [0, [Validators.required, Validators.min(1)]],
        dueDate: ['', Validators.required],
        advancePercentage: [{ value: 0, disabled: true }, [Validators.min(1), Validators.max(100)]],
      }),
      installments: this.fb.array([] as FormGroup[]),
    });
  }

  createInstallmentGroup(order: number): FormGroup {
    return this.fb.nonNullable.group({
      order: [order],
      amount: [0, [Validators.required, Validators.min(1)]],
      dueDate: ['', Validators.required],
      // Tuition advance is configured per installment, independently of enrollment-fee advance.
      advanceAllowed: [false],
      advancePercentage: [{ value: 0, disabled: true }, [Validators.min(1), Validators.max(100)]],
    });
  }

  availableSpecialties(type: EducationType): RefSpecialty[] {
    if (type === 'general') return [];
    return this.specialties();
  }

  onClassSystemChange(): void {
    this.form.controls.levelId.setValue('');
    this.loadLevels();
  }

  onEducationTypeChange(type: EducationType): void {
    this.form.controls.educationType.setValue(type);
    this.form.controls.specialtyId.setValue('');
    this.form.controls.specialtyOther.setValue('');
    this.form.controls.levelId.setValue('');
    this.loadLevels();
  }

  onSpecialtyChange(specialtyId: string): void {
    this.form.controls.specialtyId.setValue(specialtyId);
    if (specialtyId !== 'other') {
      this.form.controls.specialtyOther.setValue('');
    }
    this.form.controls.levelId.setValue('');
  }

  isSpecialtyRequired(): boolean {
    const type = this.form.controls.educationType.value;
    return type === 'technical' || type === 'vocational';
  }

  addInstallment(): void {
    this.installments.push(this.createInstallmentGroup(this.installments.length + 1));
    this.cdr.markForCheck();
  }

  removeInstallment(index: number): void {
    this.installments.removeAt(index);
    this.installments.controls.forEach((ctrl, idx) => ctrl.get('order')?.setValue(idx + 1));
    this.cdr.markForCheck();
  }

  /** Enrollment-fee advance toggle (class-level) — does not affect installment advances. */
  onAdvanceToggle(): void {
    this.applyAdvancePercentageControl(
      this.form.get('enrollmentFee')?.get('advancePercentage'),
      this.form.controls.advanceAllowed.value,
    );
    this.cdr.markForCheck();
  }

  /** Per-installment tuition advance toggle. */
  onInstallmentAdvanceToggle(index: number): void {
    const group = this.installments.at(index);
    this.applyAdvancePercentageControl(
      group.get('advancePercentage'),
      Boolean(group.get('advanceAllowed')?.value),
    );
    this.cdr.markForCheck();
  }

  private applyAdvancePercentageControl(
    ctrl: import('@angular/forms').AbstractControl | null | undefined,
    enabled: boolean,
  ): void {
    if (!ctrl) return;
    if (enabled) {
      ctrl.enable();
      ctrl.setValidators([Validators.required, Validators.min(1), Validators.max(100)]);
    } else {
      ctrl.disable();
      ctrl.clearValidators();
      ctrl.setValue(0);
    }
    ctrl.updateValueAndValidity();
  }

  systemI18nKey(system: EducationSystem): string {
    return this.educationSystemI18n[system];
  }

  trackByIndex(i: number): number {
    return i;
  }

  cancelLink(): string[] {
    return ['/schools', this.schoolId() ?? ''];
  }

  save(): void {
    if (!this.school || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue() as ClassRawValue;
    const allFees = [raw.enrollmentFee, ...raw.installments];
    const orderErr = validateFeesChronological(
      allFees.map((f) => ({ amount: f.amount, dueDate: String(f.dueDate) })),
    );
    if (orderErr) {
      this.notification.error('Due dates must be in chronological order (enrollment fee → installments)');
      return;
    }

    const classPayload: SchoolClass = {
      id: this.classId() ?? undefined,
      system: this.isBilingual()
        ? raw.system
        : this.school.schoolSystem === 'anglophone'
          ? 'anglophone'
          : 'francophone',
      educationType: raw.educationType,
      specialtyId: raw.specialtyId || undefined,
      specialtyOther: raw.specialtyId === 'other' ? raw.specialtyOther : undefined,
      levelId: raw.levelId,
      levelLabel: this.levels().find((l) => l.id === raw.levelId)?.label,
      name: raw.name,
      totalSeats: raw.totalSeats,
      advanceAllowed: raw.advanceAllowed,
      enrollmentFee: {
        amount: raw.enrollmentFee.amount,
        dueDate: toUtcMidnightIso(raw.enrollmentFee.dueDate),
        advancePercentage: raw.advanceAllowed ? raw.enrollmentFee.advancePercentage : undefined,
      },
      installments: raw.installments.map((inst, idx) => ({
        order: idx + 1,
        amount: inst.amount,
        dueDate: toUtcMidnightIso(inst.dueDate),
        advanceAllowed: inst.advanceAllowed,
        advancePercentage: inst.advanceAllowed ? inst.advancePercentage : undefined,
      })),
    };

    this.saving.set(true);
    const request$ =
      this.isEdit() && this.classId()
        ? this.repository.updateClass(this.school.id, this.classId()!, classPayload)
        : this.repository.addClass(this.school.id, classPayload);

    request$.subscribe({
      next: () => {
        this.formDirty = false;
        this.notification.success('COMMON.SUCCESS');
        void this.router.navigate(['/schools', this.school!.id]);
      },
      error: () => {
        this.saving.set(false);
        this.notification.error('COMMON.ERROR');
      },
    });
  }

  private patchClass(cls: SchoolClass): void {
    this.form.patchValue({
      system: cls.system ?? this.form.controls.system.value,
      educationType: cls.educationType,
      specialtyId: cls.specialtyId ?? '',
      specialtyOther: cls.specialtyOther ?? '',
      levelId: cls.levelId,
      name: cls.name,
      totalSeats: cls.totalSeats,
      advanceAllowed: cls.advanceAllowed,
      enrollmentFee: {
        amount: cls.enrollmentFee.amount,
        dueDate: cls.enrollmentFee.dueDate,
        advancePercentage: cls.enrollmentFee.advancePercentage ?? 0,
      },
    });

    if (cls.advanceAllowed) {
      this.form.get('enrollmentFee')?.get('advancePercentage')?.enable();
    }

    this.installments.clear();
    cls.installments.forEach((inst) => {
      const instGroup = this.createInstallmentGroup(inst.order);
      instGroup.patchValue({
        order: inst.order,
        amount: inst.amount,
        dueDate: inst.dueDate,
        advanceAllowed: Boolean(inst.advanceAllowed),
        advancePercentage: inst.advancePercentage ?? 0,
      });
      if (inst.advanceAllowed) {
        this.applyAdvancePercentageControl(instGroup.get('advancePercentage'), true);
      }
      this.installments.push(instGroup);
    });

    this.formDirty = false;
  }

  private classSystem(): EducationSystem {
    if (!this.isBilingual()) {
      return this.school?.schoolSystem === 'anglophone' ? 'anglophone' : 'francophone';
    }
    return this.form.controls.system.value;
  }

  get csvValidCount(): number {
    return this.csvRows().filter((r) => r.errors.length === 0).length;
  }

  get csvInvalidCount(): number {
    return this.csvRows().filter((r) => r.errors.length > 0).length;
  }

  downloadCsvTemplate(): void {
    const csv = this.csvImportService.buildTemplate();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schoolgate-classes-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  onCsvFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.school) return;

    this.csvParsing.set(true);
    this.csvSummary.set(null);
    this.csvRows.set([]);

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const rawRows = this.csvImportService.parse(text);
      if (rawRows.length === 0) {
        this.csvParsing.set(false);
        this.notification.error('SCHOOLS.CSV.EMPTY');
        this.cdr.markForCheck();
        return;
      }
      this.csvImportService.buildRows(rawRows, this.school!, this.specialties()).subscribe({
        next: (rows) => {
          this.csvRows.set(rows);
          this.csvParsing.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.csvParsing.set(false);
          this.notification.error('COMMON.ERROR');
          this.cdr.markForCheck();
        },
      });
    };
    reader.onerror = () => {
      this.csvParsing.set(false);
      this.notification.error('COMMON.ERROR');
    };
    reader.readAsText(file);
    input.value = '';
  }

  clearCsvImport(): void {
    this.csvRows.set([]);
    this.csvSummary.set(null);
  }

  importCsvRows(): void {
    const schoolId = this.schoolId();
    const validRows = this.csvRows().filter((r) => r.schoolClass);
    if (!schoolId || validRows.length === 0) return;

    this.csvImporting.set(true);
    from(validRows)
      .pipe(
        concatMap((row) =>
          this.repository.addClass(schoolId, row.schoolClass!).pipe(
            map(() => ({ ok: true })),
            catchError(() => of({ ok: false })),
          ),
        ),
        toArray(),
      )
      .subscribe((results) => {
        const success = results.filter((r) => r.ok).length;
        const failed = results.length - success;
        this.csvImporting.set(false);
        this.csvSummary.set({ success, failed });
        this.csvRows.set([]);
        if (failed === 0) {
          this.notification.success('SCHOOLS.CSV.IMPORT_SUCCESS');
        } else {
          this.notification.error('SCHOOLS.CSV.IMPORT_PARTIAL');
        }
        this.cdr.markForCheck();
      });
  }

  private loadLevels(): void {
    const levelCtrl = this.form.controls.levelId;
    const type = this.form.controls.educationType.value;
    const system = this.classSystem();
    if (!type || !system) {
      levelCtrl.setValue('');
      levelCtrl.disable();
      this.levels.set([]);
      return;
    }
    this.refRepository.getLevels(system, type).subscribe((rows) => {
      this.levels.set(rows);
      if (rows.length > 0) {
        levelCtrl.enable();
      } else {
        levelCtrl.setValue('');
        levelCtrl.disable();
      }
      this.cdr.markForCheck();
    });
  }
}
