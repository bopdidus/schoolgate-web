import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, map, throwError } from 'rxjs';
import {
  AuthService as OpenApiAuthService,
  LoginRequestDto,
  PasswordResetRequestDto,
  UserDto,
} from '../../api';
import { SKIP_AUTH_REFRESH } from '../interceptors/http-context-tokens';
import { unwrapData } from '../utils/openapi-helpers';
import {
  AuthTokens,
  ChangePasswordRequest,
  LoginCredentials,
  UpdateProfileRequest,
  User,
} from '../models/auth.model';
import { UserRole } from '../../shared/models/common.model';

export interface AuthApi {
  login(credentials: LoginCredentials): Observable<{ user: User; tokens: AuthTokens }>;
  refreshToken(): Observable<AuthTokens>;
  getProfile(): Observable<User>;
  updateProfile(data: UpdateProfileRequest): Observable<User>;
  changePassword(data: ChangePasswordRequest): Observable<void>;
  logout(): Observable<void>;
  /**
   * No self-service reset: this just notifies the platform admin, who resets
   * the account out-of-band. Always resolves — the backend returns an
   * identical response whether or not the email is registered.
   */
  requestPasswordReset(email: string): Observable<void>;
}

/**
 * The OpenAPI client types the HttpOnly refresh cookie as a required string
 * parameter, but never puts it on the wire (JS cannot read/set HttpOnly cookies).
 * Passing any non-null sentinel satisfies the generated guard; the real token
 * travels only via `withCredentials: true` (see `app.config.ts`).
 */
const HTTPONLY_COOKIE_SENTINEL = 'httponly';

@Injectable({ providedIn: 'root' })
export class AuthApiService implements AuthApi {
  private readonly authApi = inject(OpenApiAuthService);

  /** Auth endpoints must never trigger the refresh-on-401 flow (see `tokenRefreshInterceptor`). */
  private readonly skipRefreshContext = new HttpContext().set(SKIP_AUTH_REFRESH, true);

  login(credentials: LoginCredentials): Observable<{ user: User; tokens: AuthTokens }> {
    const body: LoginRequestDto = {
      email: credentials.email,
      password: credentials.password,
      remember_me: credentials.rememberMe ?? false,
    };
    // xClientType stays undefined: web relies on the HttpOnly cookie transport.
    return this.authApi
      .authLoginPost(body, undefined, 'body', false, { context: this.skipRefreshContext })
      .pipe(
        map((envelope) => {
          const data = unwrapData(envelope);
          if (!data.user || !data.tokens) {
            throw new Error('Auth response missing user or tokens');
          }
          return {
            user: this.mapUser(data.user),
            tokens: this.mapTokens(data.tokens),
          };
        }),
      );
  }

  /**
   * Refresh relies exclusively on the HttpOnly cookie attached by the browser
   * (`withCredentials`). No refresh token is ever read or sent from JavaScript.
   */
  refreshToken(): Observable<AuthTokens> {
    return this.authApi
      .authRefreshPost(HTTPONLY_COOKIE_SENTINEL, undefined, undefined, 'body', false, {
        context: this.skipRefreshContext,
      })
      .pipe(
        map((envelope) => {
          const data = unwrapData(envelope);
          return this.mapTokens(data);
        }),
      );
  }

  /**
   * Backend has no `/auth/me`. Session restore uses the user cached at login.
   * Callers (AuthEffects) already fall back to cache on failure.
   */
  getProfile(): Observable<User> {
    return throwError(() => new Error('Profile endpoint is not available'));
  }

  /** Profile update is not exposed by the OpenAPI contract. */
  updateProfile(_data: UpdateProfileRequest): Observable<User> {
    return throwError(() => new Error('Profile update is not available'));
  }

  /** Password change is not exposed by the OpenAPI contract. */
  changePassword(_data: ChangePasswordRequest): Observable<void> {
    return throwError(() => new Error('Password change is not available'));
  }

  requestPasswordReset(email: string): Observable<void> {
    const body: PasswordResetRequestDto = { email };
    return this.authApi
      .authPasswordResetRequestsPost(body, undefined, false, { context: this.skipRefreshContext })
      .pipe(map(() => undefined));
  }

  /**
   * Revokes the refresh-token session server-side and clears the HttpOnly cookie.
   * Local access-token wipe alone would leave a still-valid refresh cookie.
   */
  logout(): Observable<void> {
    return this.authApi
      .authLogoutPost(HTTPONLY_COOKIE_SENTINEL, undefined, undefined, 'body', false, {
        context: this.skipRefreshContext,
      })
      .pipe(map(() => undefined));
  }

  private mapTokens(tokens: { access_token?: string }): AuthTokens {
    if (!tokens.access_token) {
      throw new Error('Auth response missing access token');
    }
    return {
      accessToken: tokens.access_token,
    };
  }

  private static readonly KNOWN_ROLES: readonly UserRole[] = [
    'admin',
    'school_admin',
    'school_editor',
    'parent',
  ];

  /**
   * Resolves the account role, refusing anything the app does not recognise.
   *
   * This used to fall back to `school_editor` when the role was missing, which
   * meant a malformed or unexpected response silently granted school-staff
   * access. An unknown role is now an authentication failure.
   */
  private resolveRole(raw: unknown): UserRole {
    const role = typeof raw === 'string' ? (raw as UserRole) : undefined;
    if (!role || !AuthApiService.KNOWN_ROLES.includes(role)) {
      throw new Error('Unsupported account role');
    }
    return role;
  }

  private mapUser(dto: UserDto & { name?: string }): User {
    const explicitName = dto.name != null ? String(dto.name).trim() : '';
    const composedName = [dto.first_name, dto.last_name]
      .filter((part) => part != null && String(part).trim() !== '')
      .join(' ')
      .trim();

    return {
      id: String(dto.id ?? ''),
      email: String(dto.email ?? ''),
      name: explicitName || composedName,
      role: this.resolveRole(dto.role),
      schoolId: dto.school_id != null ? String(dto.school_id) : undefined,
      isActive: true,
      createdAt: '',
    };
  }
}
