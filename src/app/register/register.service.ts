import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AuthService as OpenApiAuthService, SchoolRegistrationRequestDto } from '../api';
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
}

/** The API validates an empty email as malformed, so blanks are left out. */
function blankToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}
