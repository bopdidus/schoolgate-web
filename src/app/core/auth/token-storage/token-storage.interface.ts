import { Observable } from 'rxjs';
import { User } from '../models/auth.model';

/**
 * Security boundary: the refresh token is intentionally NOT part of this contract.
 * It must never be read or held by JavaScript — it lives exclusively in the
 * HttpOnly cookie set by the backend, which the browser attaches automatically
 * on requests made with `withCredentials: true`. This removes it entirely from
 * the XSS attack surface (no `document.cookie` access, no storage read).
 *
 * The access token is short-lived and only ever kept in memory (see
 * `InMemoryTokenStorage`) — never written to `localStorage`/`sessionStorage`,
 * which are readable by any script running on the page.
 */
export abstract class TokenStorage {
  abstract getAccessToken(): string | null;
  abstract setAccessToken(accessToken: string | null): void;

  /**
   * Emits every time the access token changes (login, refresh, logout/clear).
   * `TokenExpiryService` subscribes to this instead of being handed the token
   * directly — that keeps it decoupled from `AuthService`/`HttpAuthRepository`
   * and avoids a circular DI graph (AuthService -> expiry -> refresh -> AuthService).
   */
  abstract readonly accessToken$: Observable<string | null>;

  /**
   * The cached user profile is NOT a secret (no tokens, just display data), so
   * persisting it is fine and lets the UI restore instantly after a reload while
   * the real session is re-established via the cookie-based refresh (see
   * `AuthEffects.init$`).
   */
  abstract getUser(): User | null;
  abstract setUser(user: User): void;

  /** Wipes the in-memory access token and the cached profile. */
  abstract clear(): void;
}
