import { Injectable, inject } from '@angular/core';
import { Observable, map, of, throwError } from 'rxjs';
import {
  AuthService as OpenApiAuthService,
  CreateSchoolUserRequestDto,
  UserDto,
} from '../../../api';
import { PaginatedResponse, UserRole } from '../../../shared/models/common.model';
import { unwrapData } from '../../../core/api/openapi-helpers';
import { User } from '../../../core/auth/models/auth.model';

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  schoolId?: string;
}

@Injectable({ providedIn: 'root' })
export class UserRepository {
  private readonly authApi = inject(OpenApiAuthService);

  /** User listing is not part of the OpenAPI contract. */
  getAll(page = 1, pageSize = 10): Observable<PaginatedResponse<User>> {
    return of({ data: [], total: 0, page, page_size: pageSize });
  }

  create(data: CreateUserRequest): Observable<User> {
    if (data.role === 'admin') {
      return throwError(() => new Error('Admin users cannot be created via this API'));
    }
    const [firstName, ...rest] = data.name.trim().split(/\s+/);
    const body: CreateSchoolUserRequestDto = {
      email: data.email,
      password: data.password,
      first_name: firstName || data.name,
      last_name: rest.join(' ') || firstName || data.name,
      role: data.role as CreateSchoolUserRequestDto.RoleEnum,
    };
    return this.authApi.authSchoolUsersPost(body).pipe(
      map((envelope) => this.mapUser(unwrapData(envelope))),
    );
  }

  /** User activation toggle is not part of the OpenAPI contract. */
  toggleActive(id: string, isActive: boolean): Observable<User> {
    return of({
      id,
      email: '',
      name: '',
      role: 'school_editor',
      isActive,
      createdAt: '',
    });
  }

  private mapUser(dto: UserDto): User {
    const name = [dto.first_name, dto.last_name]
      .filter((part) => part != null && String(part).trim() !== '')
      .join(' ')
      .trim();
    return {
      id: String(dto.id ?? ''),
      email: String(dto.email ?? ''),
      name,
      role: (dto.role as UserRole) ?? 'school_editor',
      isActive: true,
      createdAt: '',
    };
  }
}
