import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TokenStorage } from './token-storage.interface';
import { User } from '../models/auth.model';

/** Non-sensitive UI cache only — see `TokenStorage` for why this is safe to persist. */
const USER_KEY = 'sg_user';

/**
 * Keeps the access token as a private field, never written to `localStorage`/
 * `sessionStorage`. This is the core mitigation against token theft via XSS:
 * an injected script can still call app code, but it can no longer read the
 * token out of a storage API that persists across page loads/tabs.
 *
 * The trade-off is that this token disappears on every full page reload —
 * that's expected and handled by a cookie-backed refresh at bootstrap
 * (`AuthEffects.init$`), not by resurrecting the token from storage.
 */
@Injectable({ providedIn: 'root' })
export class InMemoryTokenStorage implements TokenStorage {
  private accessToken: string | null = null;

  private readonly accessTokenSubject = new BehaviorSubject<string | null>(null);
  readonly accessToken$: Observable<string | null> = this.accessTokenSubject.asObservable();

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setAccessToken(accessToken: string | null): void {
    this.accessToken = accessToken;
    this.accessTokenSubject.next(accessToken);
  }

  getUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  clear(): void {
    this.setAccessToken(null);
    localStorage.removeItem(USER_KEY);
  }
}
