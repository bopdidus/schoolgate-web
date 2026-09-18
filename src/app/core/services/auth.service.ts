import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import {
  AuthTokens,
  ChangePasswordRequest,
  LoginCredentials,
  UpdateProfileRequest,
  User,
} from '../models/auth.model';
import { TokenStorage } from './token-storage';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApi = inject(AuthApiService);
  private readonly tokenStorage = inject(TokenStorage);

  login(credentials: LoginCredentials): Observable<{ user: User; tokens: AuthTokens }> {
    return this.authApi.login(credentials).pipe(
      tap(({ user, tokens }) => {
        this.persistTokens(tokens);
        this.tokenStorage.setUser(user);
      }),
    );
  }

  /**
   * No token is read from storage before calling this: the refresh token rides
   * along automatically in the HttpOnly cookie (`withCredentials: true`), so the
   * authApi call needs no argument. If the cookie is missing/expired the
   * backend simply answers 401 and callers (interceptor/guard) treat it as an
   * unrecoverable session, same as before.
   */
  refreshToken(): Observable<AuthTokens> {
    return this.authApi.refreshToken().pipe(tap((tokens) => this.persistTokens(tokens)));
  }

  getProfile(): Observable<User> {
    return this.authApi.getProfile().pipe(
      tap((user) => this.tokenStorage.setUser(user)),
    );
  }

  /** Cached profile from the last successful login / `/auth/me` — used to restore UI on reload. */
  getCachedUser(): User | null {
    return this.tokenStorage.getUser();
  }

  updateProfile(data: UpdateProfileRequest): Observable<User> {
    return this.authApi.updateProfile(data).pipe(
      tap((user) => this.tokenStorage.setUser(user)),
    );
  }

  changePassword(data: ChangePasswordRequest): Observable<void> {
    return this.authApi.changePassword(data);
  }

  /**
   * Always round-trips through the backend before wiping local state: revocation
   * of the refresh-token cookie is the server's job, so a purely local "clear the
   * token" logout would leave a live refresh token behind. On network/server
   * failure we still clear locally (best effort) so the user isn't stuck logged in
   * in the UI, but the cookie may persist until it naturally expires.
   */
  logout(): Observable<void> {
    return this.authApi.logout().pipe(tap(() => this.tokenStorage.clear()));
  }

  clearSession(): void {
    this.tokenStorage.clear();
  }

  isAuthenticated(): boolean {
    return !!this.tokenStorage.getAccessToken();
  }

  private persistTokens(tokens: AuthTokens): void {
    this.tokenStorage.setAccessToken(tokens.accessToken);
  }
}
