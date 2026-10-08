import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AuthService as OpenApiAuthService, RegisterRequestDto, SchoolRegistrationRequestDto } from '../api';
import { SKIP_AUTH_REFRESH } from '../core/interceptors/http-context-tokens';
import { SchoolSystem } from '../shared/models/common.model';
import { unwrapData } from '../core/utils/openapi-helpers';

export interface SchoolRegistration {
  school: {
    name: string;
    cityId: number;
    system: SchoolSystem;
    address: string;
    phone: string;
    email: string;
  };
  admin: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  };
}

/** A parent account (role `parent`), as created by the mobile app. */
export interface ParentRegistration {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

/** `active`: published now; `pending`: waits for a platform admin. */
export interface SchoolRegistrationResult {
  schoolId: string;
  status: 'active' | 'pending';
  adminEmail: string;
}

@Injectable({ providedIn: 'root' })
export class RegisterService {
  private readonly authApi = inject(OpenApiAuthService);

  /** Public sign-up: creates the school and its first school_admin account. */
  register(data: SchoolRegistration): Observable<SchoolRegistrationResult> {
    const body: SchoolRegistrationRequestDto = {
      school: {
        name: data.school.name.trim(),
        city_id: data.school.cityId,
        system: data.school.system,
        address: blankToUndefined(data.school.address),
        phone: blankToUndefined(data.school.phone),
        email: blankToUndefined(data.school.email),
      },
      admin: {
        first_name: data.admin.firstName.trim(),
        last_name: data.admin.lastName.trim(),
        email: data.admin.email.trim(),
        phone: blankToUndefined(data.admin.phone),
        password: data.admin.password,
      },
    };
    return this.authApi.authSchoolRegistrationsPost(body).pipe(
      map((envelope) => {
        const result = unwrapData(envelope);
        return {
          schoolId: String(result?.school_id ?? ''),
          status: result?.status === 'active' ? 'active' : 'pending',
          adminEmail: String(result?.admin_email ?? data.admin.email),
        };
      }),
    );
  }

  /**
   * Public parent sign-up (`POST /auth/register`). A 401/409 here is about the
   * form, never about a session, so the refresh-on-401 flow is skipped.
   */
  registerParent(data: ParentRegistration): Observable<void> {
    const body: RegisterRequestDto = {
      first_name: data.firstName.trim(),
      last_name: data.lastName.trim(),
      email: data.email.trim(),
      phone: blankToUndefined(data.phone),
      password: data.password,
    };
    return this.authApi
      .authRegisterPost(body, 'body', false, { context: new HttpContext().set(SKIP_AUTH_REFRESH, true) })
      .pipe(map(() => undefined));
  }
}

/** The API validates an empty email as malformed, so blanks are left out. */
function blankToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}
