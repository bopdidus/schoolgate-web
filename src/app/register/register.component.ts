import { Component, DestroyRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { RegisterService, SchoolRegistrationResult } from './register.service';
import { SchoolSystem } from '../shared/models/common.model';
import { SCHOOL_SYSTEMS, SCHOOL_SYSTEM_I18N } from '../shared/constants/education-system.constants';
import { matchesControl } from '../shared/validators/matches-control.validator';
import { BrandLogoComponent } from '../shared/components/brand-logo/brand-logo.component';
import { CityAutocompleteComponent } from '../shared/components/city-autocomplete/city-autocomplete.component';

/** Same rule as the API. */
export const MIN_PASSWORD_LENGTH = 8;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule,
    BrandLogoComponent,
    CityAutocompleteComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly registerService = inject(RegisterService);

  readonly systems = SCHOOL_SYSTEMS;
  readonly systemI18n = SCHOOL_SYSTEM_I18N;
  readonly minPasswordLength = MIN_PASSWORD_LENGTH;

  readonly submitting = signal(false);
  readonly result = signal<SchoolRegistrationResult | null>(null);
  readonly hidePassword = signal(true);
  readonly hideConfirmPassword = signal(true);

  readonly form = this.fb.nonNullable.group({
    school: this.fb.nonNullable.group({
      name: ['', Validators.required],
      cityId: this.fb.control<number | null>(null, Validators.required),
      system: ['francophone' as SchoolSystem, Validators.required],
      address: [''],
      phone: [''],
      email: ['', Validators.email],
    }),
    admin: this.fb.nonNullable.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)]],
      confirmPassword: ['', [Validators.required, matchesControl('password')]],
    }),
  });

  constructor() {
    const admin = this.form.controls.admin.controls;
    // The confirmation must be re-checked when the password it copies changes.
    admin.password.valueChanges
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => admin.confirmPassword.updateValueAndValidity());
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { school, admin } = this.form.getRawValue();
    this.submitting.set(true);
    this.registerService
      .register({
        school: { ...school, cityId: school.cityId as number },
        admin: {
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          phone: admin.phone,
          password: admin.password,
        },
      })
      .subscribe({
        next: (result) => {
          this.submitting.set(false);
          this.result.set(result);
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          // The toast comes from the HTTP error interceptor; this also points
          // at the field to fix.
          if (error instanceof HttpErrorResponse && error.status === 409) {
            this.form.controls.admin.controls.email.setErrors({ taken: true });
          }
        },
      });
  }
}
