import { Component, DestroyRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { RegisterService } from '../register.service';
import { MIN_PASSWORD_LENGTH } from '../register.component';
import { AuthActions } from '../../core/store/auth.actions';
import { matchesControl } from '../../shared/validators/matches-control.validator';
import { BrandLogoComponent } from '../../shared/components/brand-logo/brand-logo.component';

/**
 * Parent sign-up, as on the mobile app. Once the account exists the parent is
 * signed in through the regular login flow (session cookie, profile, landing
 * in the parent space), so there is a single way a session starts.
 */
@Component({
  selector: 'app-parent-register',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule,
    BrandLogoComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './parent-register.component.html',
  styleUrl: '../register.component.scss',
})
export class ParentRegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly registerService = inject(RegisterService);
  private readonly store = inject(Store);

  readonly minPasswordLength = MIN_PASSWORD_LENGTH;
  readonly submitting = signal(false);
  readonly hidePassword = signal(true);
  readonly hideConfirmPassword = signal(true);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)]],
    confirmPassword: ['', [Validators.required, matchesControl('password')]],
  });

  constructor() {
    const c = this.form.controls;
    // The confirmation must be re-checked when the password it copies changes.
    c.password.valueChanges
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => c.confirmPassword.updateValueAndValidity());
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.submitting.set(true);
    this.registerService
      .registerParent({
        firstName: v.firstName,
        lastName: v.lastName,
        email: v.email,
        phone: v.phone,
        password: v.password,
      })
      .subscribe({
        next: () => {
          this.store.dispatch(
            AuthActions.login({ credentials: { email: v.email.trim(), password: v.password, rememberMe: true } }),
          );
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          // The toast comes from the HTTP error interceptor; this also points
          // at the field to fix.
          if (error instanceof HttpErrorResponse && error.status === 409) {
            this.form.controls.email.setErrors({ taken: true });
          }
        },
      });
  }
}
