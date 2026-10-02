import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { PageHeaderComponent } from '../shared/components/page-header/page-header.component';
import { LanguageService } from '../core/services/language.service';
import { AuthService } from '../core/services/auth.service';
import { AuthActions } from '../core/store/auth.actions';
import { selectUser } from '../core/store/auth.reducer';
import { NotificationService } from '../core/services/notification.service';
import { ThemeService, ThemeMode } from '../core/services/theme.service';
import { matchesControl } from '../shared/validators/matches-control.validator';
import { PaymentSettingsPanelComponent } from './payment-settings-panel/payment-settings-panel.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatDividerModule,
    MatCardModule,
    TranslateModule,
    PageHeaderComponent,
    PaymentSettingsPanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);
  readonly languageService = inject(LanguageService);
  readonly theme = inject(ThemeService);

  readonly user$ = this.store.select(selectUser);
  /** Payment accounts belong to a school: platform admins without one don't get the card. */
  readonly schoolId = toSignal(this.user$.pipe(map((user) => user?.schoolId ?? null)), { initialValue: null });

  readonly profileForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, matchesControl('newPassword')]],
  });

  readonly hideCurrentPassword = signal(true);
  readonly hideNewPassword = signal(true);
  readonly hideConfirmPassword = signal(true);

  constructor() {
    // The confirmation must be re-checked when the password it copies changes.
    this.passwordForm.controls.newPassword.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.passwordForm.controls.confirmPassword.updateValueAndValidity());
  }

  ngOnInit(): void {
    this.user$.subscribe((user) => {
      if (user) {
        this.profileForm.patchValue({ name: user.name, email: user.email });
      }
    });
  }

  onLanguageChange(lang: 'en' | 'fr'): void {
    this.languageService.setLanguage(lang);
  }

  onThemeChange(mode: ThemeMode): void {
    this.theme.apply(mode);
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.authService.updateProfile(this.profileForm.getRawValue()).subscribe({
      next: (user) => {
        this.store.dispatch(AuthActions.updateProfileSuccess({ user }));
        this.notification.success('SETTINGS.PROFILE_UPDATED');
      },
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    const v = this.passwordForm.getRawValue();
    this.authService
      .changePassword({ current_password: v.currentPassword, new_password: v.newPassword })
      .subscribe({
        next: () => {
          this.passwordForm.reset();
          this.notification.success('SETTINGS.PASSWORD_CHANGED');
        },
      });
  }
}
