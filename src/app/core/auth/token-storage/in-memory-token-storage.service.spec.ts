import { TestBed } from '@angular/core/testing';
import { InMemoryTokenStorage } from './in-memory-token-storage.service';
import { User } from '../models/auth.model';

const USER_KEY = 'sg_user';

const MOCK_USER: User = {
  id: '1',
  email: 'admin@test.com',
  name: 'Admin',
  role: 'admin',
  isActive: true,
  createdAt: '',
};

describe('InMemoryTokenStorage', () => {
  let storage: InMemoryTokenStorage;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [InMemoryTokenStorage] });
    storage = TestBed.inject(InMemoryTokenStorage);
  });

  afterEach(() => localStorage.clear());

  it('should return null when no access token was ever set', () => {
    expect(storage.getAccessToken()).toBeNull();
  });

  it('should hold the access token only in memory, never in localStorage/sessionStorage', () => {
    storage.setAccessToken('secret-access-token');

    expect(storage.getAccessToken()).toBe('secret-access-token');
    // Security assertion: the token must not leak into any Web Storage API,
    // which is readable by any script on the page (XSS surface).
    expect(JSON.stringify(localStorage)).not.toContain('secret-access-token');
    expect(JSON.stringify(sessionStorage)).not.toContain('secret-access-token');
  });

  it('should emit the new access token on accessToken$ when it changes', () => {
    const emitted: (string | null)[] = [];
    storage.accessToken$.subscribe((token) => emitted.push(token));

    storage.setAccessToken('token-a');
    storage.setAccessToken('token-b');

    expect(emitted).toEqual([null, 'token-a', 'token-b']);
  });

  it('should never expose a refresh token — the storage contract has no such accessor', () => {
    expect((storage as unknown as Record<string, unknown>)['getRefreshToken']).toBeUndefined();
  });

  it('should persist and retrieve the (non-sensitive) cached user profile', () => {
    storage.setUser(MOCK_USER);

    expect(storage.getUser()).toEqual(MOCK_USER);
    expect(localStorage.getItem(USER_KEY)).toContain(MOCK_USER.email);
  });

  it('should clear the in-memory access token and the cached user on clear()', () => {
    storage.setAccessToken('access');
    storage.setUser(MOCK_USER);

    storage.clear();

    expect(storage.getAccessToken()).toBeNull();
    expect(storage.getUser()).toBeNull();
  });
});
