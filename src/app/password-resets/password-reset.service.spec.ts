import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { PasswordResetService } from './password-reset.service';
import { PasswordResetRequest, PasswordResetStats } from './password-reset.model';
import { PaginatedResponse } from '../shared/models/common.model';
import { provideTestDefaults } from '../../testing/test-providers';

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let http: HttpTestingController;

  const requestsUrl = (url: string) => url.endsWith('/auth/password-reset-requests');

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideTestDefaults() });
    service = TestBed.inject(PasswordResetService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('passes the status and user filters, paginated', () => {
    service.getAll({ status: 'pending', userId: '8', page: 2, pageSize: 10 }).subscribe();

    const req = http.expectOne((r) => requestsUrl(r.url));
    expect(req.request.params.get('status')).toBe('pending');
    expect(req.request.params.get('user_id')).toBe('8');
    expect(req.request.params.get('limit')).toBe('10');
    expect(req.request.params.get('offset')).toBe('10');
    req.flush({ code: 'OK', data: [], meta: { total: 0 } });
  });

  it('maps the requester and the status', () => {
    let result: PaginatedResponse<PasswordResetRequest> | undefined;
    service.getAll().subscribe((r) => (result = r));

    http.expectOne((r) => requestsUrl(r.url)).flush({
      code: 'OK',
      data: [
        {
          id: 4,
          user_id: 8,
          user: { id: 8, first_name: 'My', last_name: 'Verifadmin', email: 'admin@verif.com', role: 'school_admin' },
          status: 'resolved',
          requested_at: '2026-09-19T04:54:58Z',
          resolved_at: '2026-09-19T06:00:00Z',
        },
      ],
      meta: { total: 1 },
    });

    expect(result?.data[0]).toEqual({
      id: '4',
      userId: '8',
      name: 'My Verifadmin',
      email: 'admin@verif.com',
      role: 'school_admin',
      status: 'resolved',
      requestedAt: '2026-09-19T04:54:58Z',
      resolvedAt: '2026-09-19T06:00:00Z',
    });
  });

  it('summarizes a user\'s history from the filtered totals', () => {
    let stats: PasswordResetStats | undefined;
    service.getStatsForUser('8').subscribe((s) => (stats = s));

    const [all, pending] = http.match((r) => requestsUrl(r.url));
    expect(pending.request.params.get('status')).toBe('pending');
    all.flush({
      code: 'OK',
      data: [{ id: 4, user_id: 8, status: 'pending', requested_at: '2026-09-19T04:54:58Z' }],
      meta: { total: 3 },
    });
    pending.flush({ code: 'OK', data: [], meta: { total: 1 } });

    expect(stats).toEqual({ total: 3, pending: 1, lastRequestedAt: '2026-09-19T04:54:58Z' });
  });
});
