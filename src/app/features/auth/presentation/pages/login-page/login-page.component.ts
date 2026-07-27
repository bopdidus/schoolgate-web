import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import { AuthActions } from '../../../../../core/auth/store/auth.actions';
import { selectError, selectLoading } from '../../../../../core/auth/store/auth.reducer';
import { environment } from '../../../../../../environments/environment';
import { MOCK_CREDENTIALS } from '../../../../../core/mock/mock-data';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    AsyncPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);

  /** Where `authGuard` sent the user from before bouncing them to `/login`, if any. */
  private readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? undefined;

  readonly loading$ = this.store.select(selectLoading);
  readonly error$ = this.store.select(selectError);
  readonly useMockApi = environment.useMockApi;
  readonly mockAdminEmail = MOCK_CREDENTIALS.admin.email;
  readonly mockSchoolAdminEmail = MOCK_CREDENTIALS.school_admin.email;
  readonly mockSchoolEditorEmail = MOCK_CREDENTIALS.school_editor.email;
  readonly mockPassword = MOCK_CREDENTIALS.admin.password;
  readonly hidePassword = { value: true };

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor() {
    if (this.useMockApi) {
      this.form.patchValue({
        email: MOCK_CREDENTIALS.admin.email,
        password: MOCK_CREDENTIALS.admin.password,
      });
    }
  }

  signInAsAdmin(): void {
    this.form.patchValue(MOCK_CREDENTIALS.admin);
    this.onSubmit();
  }

  signInAsSchoolAdmin(): void {
    this.form.patchValue(MOCK_CREDENTIALS.school_admin);
    this.onSubmit();
  }

  signInAsSchoolEditor(): void {
    this.form.patchValue(MOCK_CREDENTIALS.school_editor);
    this.onSubmit();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.store.dispatch(
      AuthActions.login({ credentials: this.form.getRawValue(), returnUrl: this.returnUrl }),
    );
  }
}
