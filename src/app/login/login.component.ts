import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AsyncPipe } from '@angular/common';
import { AuthActions } from '../core/store/auth.actions';
import { selectError, selectLoading } from '../core/store/auth.reducer';
import { BrandLogoComponent } from '../shared/components/brand-logo/brand-logo.component';
import { AuthApiService } from '../core/services/auth-api.service';
import { NotificationService } from '../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    AsyncPipe,
    BrandLogoComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly authApi = inject(AuthApiService);
  private readonly notification = inject(NotificationService);

  /** Where `authGuard` sent the user from before bouncing them to `/login`, if any. */
  private readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? undefined;

  readonly loading$ = this.store.select(selectLoading);
  readonly error$ = this.store.select(selectError);
  readonly hidePassword = { value: true };

  /** Toggles the login form for a lightweight "forgot password" request. */
  readonly showForgotPassword = signal(false);
  readonly forgotPasswordSubmitting = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [false],
  });

  readonly forgotPasswordForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.store.dispatch(
      AuthActions.login({ credentials: this.form.getRawValue(), returnUrl: this.returnUrl }),
    );
  }

  openForgotPassword(): void {
    this.forgotPasswordForm.setValue({ email: this.form.controls.email.value });
    this.showForgotPassword.set(true);
  }

  cancelForgotPassword(): void {
    this.showForgotPassword.set(false);
  }

  submitForgotPassword(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }
    this.forgotPasswordSubmitting.set(true);
    const email = this.forgotPasswordForm.getRawValue().email;
    this.authApi.requestPasswordReset(email).subscribe({
      next: () => {
        this.forgotPasswordSubmitting.set(false);
        this.showForgotPassword.set(false);
        this.notification.success('AUTH.FORGOT_PASSWORD_SENT');
      },
      error: () => {
        // The backend never returns a distinguishing error for this endpoint;
        // a failure here is transport-level (network/5xx), not "email unknown".
        this.forgotPasswordSubmitting.set(false);
        this.notification.error('COMMON.ERROR');
      },
    });
  }
}
