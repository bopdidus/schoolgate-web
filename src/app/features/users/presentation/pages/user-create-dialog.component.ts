import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { UserRepository, CreateUserRequest } from '../../infrastructure/user.repository';
import { SchoolRepository } from '../../../schools/infrastructure/school.repository';
import { School } from '../../../schools/domain/models/school.model';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { UserRole } from '../../../../shared/models/common.model';

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
  template: `
    <h2 mat-dialog-title>{{ 'USERS.NEW' | translate }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="page-stack">
        <mat-form-field appearance="outline">
          <mat-label>{{ 'USERS.NAME' | translate }}</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ 'AUTH.EMAIL' | translate }}</mat-label>
          <input matInput type="email" formControlName="email" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ 'AUTH.PASSWORD' | translate }}</mat-label>
          <input matInput type="password" formControlName="password" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ 'USERS.ROLE' | translate }}</mat-label>
          <mat-select formControlName="role">
            <mat-option value="admin">{{ 'USERS.ADMIN' | translate }}</mat-option>
            <mat-option value="school_admin">{{ 'USERS.SCHOOL_ADMIN' | translate }}</mat-option>
            <mat-option value="school_editor">{{ 'USERS.SCHOOL_EDITOR' | translate }}</mat-option>
          </mat-select>
        </mat-form-field>
        @if (isSchoolRole) {
          <mat-form-field appearance="outline">
            <mat-label>{{ 'USERS.ASSIGN_SCHOOL' | translate }}</mat-label>
            <mat-select formControlName="schoolId">
              @for (school of schools(); track school.id) {
                <mat-option [value]="school.id">{{ school.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>{{ 'COMMON.CANCEL' | translate }}</button>
      <button mat-flat-button color="primary" (click)="create()" [disabled]="form.invalid">
        {{ 'COMMON.CREATE' | translate }}
      </button>
    </mat-dialog-actions>
  `,
})
export class UserCreateDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userRepo = inject(UserRepository);
  private readonly schoolRepo = inject(SchoolRepository);
  private readonly notification = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef<UserCreateDialogComponent>);

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
    this.schoolRepo.getAll({ pageSize: 100 }).subscribe((r) => this.schools.set(r.data));
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
    this.userRepo.create(data).subscribe({
      next: () => {
        this.notification.success('COMMON.SUCCESS');
        this.dialogRef.close(true);
      },
    });
  }
}
