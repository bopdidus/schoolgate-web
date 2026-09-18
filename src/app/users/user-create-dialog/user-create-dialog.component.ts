import { Component, DestroyRef, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { UserService, CreateUserRequest } from '../user.service';
import { SchoolService } from '../../schools/school.service';
import { School } from '../../schools/school.model';
import { NotificationService } from '../../core/services/notification.service';
import { UserRole } from '../../shared/models/common.model';

@Component({
  selector: 'app-user-create-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    TranslateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-create-dialog.component.html',
  styleUrl: './user-create-dialog.component.scss',
})
export class UserCreateDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly schoolService = inject(SchoolService);
  private readonly notification = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef<UserCreateDialogComponent>);
  private readonly destroyRef = inject(DestroyRef);

  readonly schools = signal<School[]>([]);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['school_admin' as UserRole, Validators.required],
    schoolId: [''],
  });

  get isSchoolRole(): boolean {
    return ['school_admin', 'school_editor'].includes(this.form.controls.role.value);
  }

  ngOnInit(): void {
    this.schoolService.getAll({ pageSize: 100 }).subscribe((r) => this.schools.set(r.data));
    this.form.controls.role.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncSchoolIdValidators());
    this.syncSchoolIdValidators();
  }

  private syncSchoolIdValidators(): void {
    const control = this.form.controls.schoolId;
    if (this.isSchoolRole) {
      control.setValidators(Validators.required);
    } else {
      control.clearValidators();
      control.setValue('');
    }
    control.updateValueAndValidity();
  }

  create(): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    const data: CreateUserRequest = {
      name: value.name,
      email: value.email,
      password: value.password,
      role: value.role,
      schoolId: this.isSchoolRole ? value.schoolId : undefined,
    };
    this.userService.create(data).subscribe({
      next: () => {
        this.notification.success('COMMON.SUCCESS');
        this.dialogRef.close(true);
      },
    });
  }
}
