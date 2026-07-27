import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { LanguageService } from '../../../../../core/i18n/language.service';
import { AuthService } from '../../../../../core/auth/application/auth.service';
import { AuthActions } from '../../../../../core/auth/store/auth.actions';
import { selectUser } from '../../../../../core/auth/store/auth.reducer';
import { NotificationService } from '../../../../../core/notifications/notification.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatCardModule,
    TranslateModule,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-page.component.html',
})
export class SettingsPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);
  readonly languageService = inject(LanguageService);

  readonly user$ = this.store.select(selectUser);

  readonly profileForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  });

  ngOnInit(): void {
    this.user$.subscribe((user) => {
      if (user) {
        this.profileForm.patchValue({ name: user.name, email: user.email });
      }
    });
  }

  get isFrench(): boolean {
    return this.languageService.getCurrentLanguage() === 'fr';
  }

  onLanguageToggle(french: boolean): void {
    this.languageService.setLanguage(french ? 'fr' : 'en');
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.authService.updateProfile(this.profileForm.getRawValue()).subscribe({
      next: (user) => {
        this.store.dispatch(AuthActions.updateProfileSuccess({ user }));
        this.notification.success('Profile updated');
      },
    });
  }

  changePassword(): void {
    const v = this.passwordForm.getRawValue();
    if (v.newPassword !== v.confirmPassword) {
      this.notification.error('Passwords do not match');
      return;
    }
    this.authService
      .changePassword({ current_password: v.currentPassword, new_password: v.newPassword })
      .subscribe({
        next: () => {
          this.passwordForm.reset();
          this.notification.success('Password changed');
        },
      });
  }
}
