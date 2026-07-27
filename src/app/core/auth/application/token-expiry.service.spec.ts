import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { of, throwError } from 'rxjs';
import { TokenExpiryService } from './token-expiry.service';
import { TokenRefreshCoordinator } from './token-refresh-coordinator.service';
import { TokenStorage } from '../token-storage/token-storage.interface';
import { InMemoryTokenStorage } from '../token-storage/in-memory-token-storage.service';
import { AuthActions } from '../store/auth.actions';
import { PROACTIVE_REFRESH_LEAD_MS } from '../auth.config';

function base64UrlEncode(input: string): string {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Builds an unsigned-but-well-formed JWT so `getJwtExpiryMs` can read `exp`. */
function buildJwt(expEpochSeconds: number): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'none' }));
  const payload = base64UrlEncode(JSON.stringify({ exp: expEpochSeconds }));
  return `${header}.${payload}.signature`;
}

describe('TokenExpiryService', () => {
  let tokenStorage: InMemoryTokenStorage;
  let tokenRefresh: jasmine.SpyObj<TokenRefreshCoordinator>;
  let store: jasmine.SpyObj<Store>;

  beforeEach(() => {
    tokenRefresh = jasmine.createSpyObj('TokenRefreshCoordinator', ['refresh']);
    store = jasmine.createSpyObj('Store', ['dispatch']);

    TestBed.configureTestingModule({
      providers: [
        TokenExpiryService,
        { provide: TokenStorage, useClass: InMemoryTokenStorage },
        { provide: TokenRefreshCoordinator, useValue: tokenRefresh },
        { provide: Store, useValue: store },
      ],
    });

    // Instantiating the service starts the `accessToken$` subscription (see constructor).
    TestBed.inject(TokenExpiryService);
    tokenStorage = TestBed.inject(TokenStorage) as InMemoryTokenStorage;
  });

  it('should NOT refresh before reaching the proactive lead window', fakeAsync(() => {
    tokenRefresh.refresh.and.returnValue(of({ accessToken: 'irrelevant' }));
    const expMs = Date.now() + 5 * 60_000;
    tokenStorage.setAccessToken(buildJwt(Math.floor(expMs / 1000)));

    tick(5 * 60_000 - PROACTIVE_REFRESH_LEAD_MS - 1000);
    expect(tokenRefresh.refresh).not.toHaveBeenCalled();

    tick(2000);
    expect(tokenRefresh.refresh).toHaveBeenCalledTimes(1);
  }));

  it('should skip scheduling silently for a token it cannot decode (server remains the real gate)', fakeAsync(() => {
    tokenStorage.setAccessToken('not-a-jwt');

    tick(60 * 60_000);
    expect(tokenRefresh.refresh).not.toHaveBeenCalled();
  }));

  it('should dispatch sessionExpired if the proactive refresh itself fails', fakeAsync(() => {
    tokenRefresh.refresh.and.returnValue(throwError(() => new Error('cookie expired')));
    const expMs = Date.now() + 2 * 60_000;
    tokenStorage.setAccessToken(buildJwt(Math.floor(expMs / 1000)));

    tick(2 * 60_000 - PROACTIVE_REFRESH_LEAD_MS + 100);

    expect(store.dispatch).toHaveBeenCalledWith(AuthActions.sessionExpired());
  }));

  it('should cancel a pending schedule when a newer access token arrives first', fakeAsync(() => {
    tokenRefresh.refresh.and.returnValue(of({ accessToken: 'irrelevant' }));
    const shortLivedExp = Math.floor((Date.now() + 5 * 60_000) / 1000);
    const longerLivedExp = Math.floor((Date.now() + 20 * 60_000) / 1000);

    tokenStorage.setAccessToken(buildJwt(shortLivedExp));
    tokenStorage.setAccessToken(buildJwt(longerLivedExp));

    // The short-lived token's original refresh point passes with no call, because
    // it was superseded before it could fire.
    tick(5 * 60_000);
    expect(tokenRefresh.refresh).not.toHaveBeenCalled();

    // The longer-lived token's own lead window arrives ~14 minutes later.
    tick(14 * 60_000);
    expect(tokenRefresh.refresh).toHaveBeenCalledTimes(1);
  }));
});
