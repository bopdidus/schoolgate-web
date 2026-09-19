import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { UserService } from '../user.service';
import { User } from '../../core/models/auth.model';
import { SchoolService } from '../../schools/school.service';
import { PasswordResetService } from '../../password-resets/password-reset.service';
import { PasswordResetStats } from '../../password-resets/password-reset.model';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SkeletonTableComponent } from '../../shared/components/skeleton-table/skeleton-table.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogResult,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LocaleDatePipe } from '../../shared/pipes/locale-date.pipe';
import { generatePassword } from '../../shared/utils/password-generator';

/** Same rule as the API (PUT /auth/school-users/{id}/password). */
export const MIN_PASSWORD_LENGTH = 8;

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatChipsModule,
    TranslateModule,
    PageHeaderComponent,
    SkeletonTableComponent,
    ErrorStateComponent,
    LocaleDatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss',
})
export class UserDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly schoolService = inject(SchoolService);
  private readonly passwordResetService = inject(PasswordResetService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly clipboard = inject(Clipboard);

  readonly minPasswordLength = MIN_PASSWORD_LENGTH;
  readonly userId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly user = signal<User | null>(null);
  readonly schoolName = signal<string | null>(null);
  readonly stats = signal<PasswordResetStats | null>(null);
  readonly hidePassword = signal(true);
  readonly saving = signal(false);

  readonly passwordForm = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)]],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.userService.getById(this.userId).subscribe({
      next: (user) => {
        this.user.set(user);
        this.loading.set(false);
        this.loadSchoolName(user);
        this.loadStats();
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  /** Fills the field with a strong random password and shows it, ready to copy. */
  generate(): void {
    this.passwordForm.controls.password.setValue(generatePassword());
    this.passwordForm.controls.password.markAsDirty();
    this.hidePassword.set(false);
  }

  copy(): void {
    const password = this.passwordForm.controls.password.value;
    if (password && this.clipboard.copy(password)) {
      this.notification.success('USERS.PASSWORD_COPIED');
    }
  }

  resetPassword(): void {
    const user = this.user();
    if (!user || this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'USERS.RESET_PASSWORD',
          message: 'USERS.RESET_PASSWORD_CONFIRM',
          confirmLabel: 'USERS.RESET_PASSWORD',
        },
        width: '420px',
      })
      .afterClosed()
      .subscribe((result: ConfirmDialogResult | undefined) => {
        if (result?.confirmed) this.submitReset(user);
      });
  }

  roleLabel(role: User['role']): string {
    switch (role) {
      case 'school_admin':
        return 'USERS.SCHOOL_ADMIN';
      case 'school_editor':
        return 'USERS.SCHOOL_EDITOR';
      default:
        return 'USERS.ADMIN';
    }
  }

  private submitReset(user: User): void {
    this.saving.set(true);
    this.userService.resetPassword(user.id, this.passwordForm.controls.password.value).subscribe({
      next: () => {
        this.saving.set(false);
        // The password stays in the field: the admin still has to pass it on.
        this.passwordForm.markAsPristine();
        this.notification.success('USERS.PASSWORD_RESET_OK');
        this.loadStats();
      },
      error: () => this.saving.set(false),
    });
  }

  private loadSchoolName(user: User): void {
    if (!user.schoolId) return;
    this.schoolService.getById(user.schoolId).subscribe({
      next: (school) => this.schoolName.set(school.name),
      error: () => this.schoolName.set(null),
    });
  }

  private loadStats(): void {
    this.passwordResetService.getStatsForUser(this.userId).subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => this.stats.set(null),
    });
  }
}
