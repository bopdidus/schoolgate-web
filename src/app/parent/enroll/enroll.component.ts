import { Component, ChangeDetectionStrategy, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of, catchError, concatMap, from, lastValueFrom, toArray } from 'rxjs';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { SkeletonTableComponent } from '../../shared/components/skeleton-table/skeleton-table.component';
import { NotificationService } from '../../core/services/notification.service';
import { CentsPipe } from '../shared/cents.pipe';
import { Child, ClassOffering, DocumentRequirement, Gender, ParentSchool } from '../domain/models';
import { ParentSchoolsService } from '../services/parent-schools.service';
import { ParentEnrollmentsService } from '../services/parent-enrollments.service';

/** Same limits as the API (POST /enrollments/{id}/documents). */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

interface PickedFile {
  file: File;
  /** Required document it satisfies; undefined = untyped. */
  documentTypeId?: string;
}

/**
 * Request a place (mobile enrollment flow): the child (saved or new, with
 * gender), new or returning student (matricule when the school offers the
 * bypass), the class, then the documents a new student must provide.
 */
@Component({
  selector: 'app-parent-enroll',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatStepperModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatSlideToggleModule,
    MatIconModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    TranslateModule,
    PageHeaderComponent,
    ErrorStateComponent,
    SkeletonTableComponent,
    CentsPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './enroll.component.html',
  styleUrl: './enroll.component.scss',
})
export class EnrollComponent implements OnInit {
  /** Route parameter `:schoolId`. */
  readonly schoolId = input.required<string>();
  /** Query parameter `classId`: the class chosen on the school page. */
  readonly classId = input<string>();

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly schoolsService = inject(ParentSchoolsService);
  private readonly enrollmentsService = inject(ParentEnrollmentsService);
  private readonly notification = inject(NotificationService);

  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly submitting = signal(false);
  readonly school = signal<ParentSchool | null>(null);
  readonly children = signal<Child[]>([]);
  readonly requirements = signal<DocumentRequirement[]>([]);
  readonly files = signal<PickedFile[]>([]);

  readonly student = this.fb.nonNullable.group({
    mode: ['new' as 'existing' | 'new'],
    childId: [''],
    firstName: [''],
    lastName: [''],
    gender: ['' as '' | Gender],
    returning: [false],
    matricule: [''],
  });

  readonly classStep = this.fb.nonNullable.group({
    classId: ['', Validators.required],
  });

  /** Classes with a seat left: a request needs one. */
  readonly openClasses = computed(() => (this.school()?.classes ?? []).filter((c) => c.seatsRemaining > 0));

  readonly enrollmentDocs = computed(() => this.requirements().filter((r) => r.purpose === 'enrollment'));

  /** Signals mirroring form values the template branches on. */
  readonly mode = signal<'existing' | 'new'>('new');
  readonly returning = signal(false);
  readonly selectedClassId = signal('');

  readonly selectedClass = computed<ClassOffering | undefined>(() =>
    this.school()?.classes.find((c) => c.id === this.selectedClassId()),
  );

  ngOnInit(): void {
    this.student.controls.mode.valueChanges.subscribe((m) => {
      this.mode.set(m);
      this.applyStudentValidators();
    });
    this.student.controls.returning.valueChanges.subscribe((r) => this.returning.set(r));
    this.classStep.controls.classId.valueChanges.subscribe((id) => this.selectedClassId.set(id));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    forkJoin({
      school: this.schoolsService.getById(this.schoolId()),
      children: this.enrollmentsService.children().pipe(catchError(() => of([]))),
      requirements: this.schoolsService.documentRequirements(this.schoolId()).pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ school, children, requirements }) => {
        this.school.set(school);
        this.children.set(children);
        this.requirements.set(requirements);
        // A parent with saved children most often enrolls one of them.
        this.student.controls.mode.setValue(children.length > 0 ? 'existing' : 'new');
        const preselected = school.classes.find((c) => c.id === this.classId() && c.seatsRemaining > 0);
        if (preselected) this.classStep.controls.classId.setValue(preselected.id);
        this.applyStudentValidators();
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  /** Saved child: pick one. New child: names and gender are required. */
  private applyStudentValidators(): void {
    const c = this.student.controls;
    const isNew = c.mode.value === 'new';
    c.childId.setValidators(isNew ? null : Validators.required);
    c.firstName.setValidators(isNew ? Validators.required : null);
    c.lastName.setValidators(isNew ? Validators.required : null);
    c.gender.setValidators(isNew ? Validators.required : null);
    for (const control of [c.childId, c.firstName, c.lastName, c.gender]) {
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

  onFilesPicked(event: Event, documentTypeId?: string): void {
    const inputEl = event.target as HTMLInputElement;
    const picked: PickedFile[] = [];
    for (const file of Array.from(inputEl.files ?? [])) {
      if (!ACCEPTED_DOCUMENT_TYPES.includes(file.type)) {
        this.notification.error('PARENT.DOCUMENT_BAD_TYPE');
        continue;
      }
      if (file.size > MAX_DOCUMENT_BYTES) {
        this.notification.error('PARENT.DOCUMENT_TOO_LARGE');
        continue;
      }
      picked.push({ file, documentTypeId });
    }
    this.files.update((current) => [...current, ...picked]);
    inputEl.value = '';
  }

  removeFile(index: number): void {
    this.files.update((current) => current.filter((_, i) => i !== index));
  }

  filesFor(documentTypeId?: string): { file: File; index: number }[] {
    return this.files()
      .map((f, index) => ({ ...f, index }))
      .filter((f) => f.documentTypeId === documentTypeId);
  }

  childName(): string {
    const v = this.student.getRawValue();
    if (v.mode === 'new') return `${v.firstName} ${v.lastName}`.trim();
    const child = this.children().find((c) => c.id === v.childId);
    return child ? `${child.firstName} ${child.lastName}` : '';
  }

  tuitionTotal(c: ClassOffering): number {
    return c.installments.reduce((sum, i) => sum + i.amountCents, 0);
  }

  async submit(): Promise<void> {
    const school = this.school();
    if (!school || this.student.invalid || this.classStep.invalid) return;
    const v = this.student.getRawValue();
    this.submitting.set(true);
    try {
      const enrollment = await lastValueFrom(
        this.enrollmentsService.create({
          classId: this.classStep.controls.classId.value,
          academicYear: school.academicYear,
          isReturningStudent: v.returning,
          childId: v.mode === 'existing' ? v.childId : undefined,
          newChild:
            v.mode === 'new' ? { firstName: v.firstName, lastName: v.lastName, gender: v.gender as Gender } : undefined,
          matricule: v.returning && school.allowsDirectPayment ? v.matricule : undefined,
        }),
      );
      // One upload per document type, as the API tags a whole call.
      const groups = new Map<string | undefined, File[]>();
      for (const f of v.returning ? [] : this.files()) {
        groups.set(f.documentTypeId, [...(groups.get(f.documentTypeId) ?? []), f.file]);
      }
      await lastValueFrom(
        from([...groups.entries()]).pipe(
          concatMap(([typeId, files]) => this.enrollmentsService.uploadDocuments(enrollment.id, files, typeId)),
          toArray(),
        ),
        { defaultValue: [] },
      );
      if (enrollment.matriculeVerificationStatus === 'denied' || enrollment.matriculeVerificationStatus === 'unavailable') {
        this.notification.warning('PARENT.MATRICULE_NOT_CONFIRMED');
      }
      void this.router.navigate(['/parent/confirmation', enrollment.id]);
    } catch {
      // The HTTP error interceptor already shows the API's message.
      this.submitting.set(false);
    }
  }
}
