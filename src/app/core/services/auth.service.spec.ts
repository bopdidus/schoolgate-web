import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthApiService } from './auth-api.service';
import { InMemoryTokenStorage } from './in-memory-token-storage.service';
import { TokenStorage } from './token-storage';

describe('AuthService', () => {
  let service: AuthService;
  let authApi: jasmine.SpyObj<AuthApiService>;
  let tokenStorage: InMemoryTokenStorage;

  beforeEach(() => {
    authApi = jasmine.createSpyObj('AuthApiService', [
      'login',
      'refreshToken',
      'getProfile',
      'logout',
    ]);
    authApi.login.and.returnValue(
      of({
        user: {
          id: '1',
          email: 'admin@test.com',
          name: 'Admin',
          role: 'admin',
          isActive: true,
          createdAt: '',
        },
        // No `refreshToken` field here by design — see `AuthTokens`.
        tokens: { accessToken: 'access' },
      }),
    );
    authApi.refreshToken.and.returnValue(of({ accessToken: 'new-access' }));
    authApi.logout.and.returnValue(of(undefined));

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AuthApiService, useValue: authApi },
        { provide: TokenStorage, useClass: InMemoryTokenStorage },
      ],
    });

    service = TestBed.inject(AuthService);
    tokenStorage = TestBed.inject(TokenStorage) as InMemoryTokenStorage;
  });

  it('should keep the access token in memory only after login (never in storage)', () => {
    service.login({ email: 'admin@test.com', password: 'secret' }).subscribe();

    expect(tokenStorage.getAccessToken()).toBe('access');
    expect(JSON.stringify(localStorage)).not.toContain('access"');
  });

  it('should cache the user profile on login for reload restoration', () => {
    service.login({ email: 'admin@test.com', password: 'secret' }).subscribe();

    expect(tokenStorage.getUser()?.email).toBe('admin@test.com');
  });

  it('should report authenticated once an access token exists in memory', () => {
    expect(service.isAuthenticated()).toBeFalse();

    service.login({ email: 'admin@test.com', password: 'secret' }).subscribe();

    expect(service.isAuthenticated()).toBeTrue();
  });

  it('should refresh without reading any token from storage (cookie carries it)', () => {
    service.refreshToken().subscribe();

    expect(authApi.refreshToken).toHaveBeenCalledWith();
    expect(tokenStorage.getAccessToken()).toBe('new-access');
  });

  it('should call the backend logout endpoint before clearing the in-memory token', () => {
    tokenStorage.setAccessToken('access');

    service.logout().subscribe();

    expect(authApi.logout).toHaveBeenCalled();
    expect(tokenStorage.getAccessToken()).toBeNull();
  });

  it('should clear the in-memory access token and cached user on clearSession()', () => {
    tokenStorage.setAccessToken('access');

    service.clearSession();

    expect(tokenStorage.getAccessToken()).toBeNull();
  });
});
