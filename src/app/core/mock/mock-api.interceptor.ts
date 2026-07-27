import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { delay, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  MOCK_ADMIN,
  MOCK_CREDENTIALS,
  MOCK_ENROLLMENTS,
  MOCK_INVOICES,
  MOCK_PAYMENTS,
  MOCK_REF_CITIES,
  MOCK_REF_LEVELS,
  MOCK_REF_SPECIALTIES,
  MOCK_SCHOOL_ADMIN,
  MOCK_SCHOOL_EDITOR,
  MOCK_SCHOOLS,
  buildAdminDashboard,
  buildSchoolCommissionSummary,
  buildSchoolDashboard,
} from './mock-data';
import { User } from '../auth/models/auth.model';
import { School } from '../../features/schools/domain/models/school.model';

const MOCK_DELAY_MS = 300;

let currentUser: User | null = null;

/** Internal mutable store so accept/reject survive the page session. */
let mockEnrollments = [...MOCK_ENROLLMENTS];
let mockSchools = [...MOCK_SCHOOLS];

function json<T>(body: T, status = 200): HttpResponse<T> {
  return new HttpResponse({ status, body });
}

function parsePath(url: string): { path: string; segments: string[] } {
  const base = environment.apiBaseUrl.replace(/\/$/, '');
  const normalized = url.split('?')[0];
  const path = normalized.startsWith(base)
    ? normalized.slice(base.length)
    : normalized.replace(/^\/api\/v1/, '');
  const segments = path.replace(/^\//, '').split('/').filter(Boolean);
  return { path, segments };
}

function paginate<T>(
  items: T[],
  params: URLSearchParams,
): { data: T[]; total: number; page: number; page_size: number } {
  const page = Number(params.get('page') ?? 1);
  const pageSize = Number(params.get('page_size') ?? 10);
  const start = (page - 1) * pageSize;
  return { data: items.slice(start, start + pageSize), total: items.length, page, page_size: pageSize };
}

function isSchoolUser(): boolean {
  return !!currentUser && (currentUser.role === 'school_admin' || currentUser.role === 'school_editor');
}

function handleMock(req: HttpRequest<unknown>): HttpResponse<unknown> | null {
  const { segments } = parsePath(req.url);
  const params = new URLSearchParams(req.url.includes('?') ? req.url.split('?')[1] : '');

  // ── Auth ────────────────────────────────────────────────────────────────
  if (segments[0] === 'auth') {
    if (segments[1] === 'login' && req.method === 'POST') {
      const body = req.body as { email: string; password: string };
      const email = body.email?.trim().toLowerCase() ?? '';
      const password = body.password ?? '';
      if (email === MOCK_CREDENTIALS.admin.email && password === MOCK_CREDENTIALS.admin.password) {
        currentUser = MOCK_ADMIN;
        localStorage.setItem('sg_mock_role', 'admin');
      } else if (
        email === MOCK_CREDENTIALS.school_admin.email &&
        password === MOCK_CREDENTIALS.school_admin.password
      ) {
        currentUser = MOCK_SCHOOL_ADMIN;
        localStorage.setItem('sg_mock_role', 'school_admin');
      } else if (
        email === MOCK_CREDENTIALS.school_editor.email &&
        password === MOCK_CREDENTIALS.school_editor.password
      ) {
        currentUser = MOCK_SCHOOL_EDITOR;
        localStorage.setItem('sg_mock_role', 'school_editor');
      } else {
        return json({ message: 'Invalid credentials' }, 401);
      }
      return json({
        data: {
          message: 'Login successful',
          tokens: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expires_in: 900,
          },
          user: currentUser,
        },
        error: null,
      });
    }
    if (segments[1] === 'refresh' && req.method === 'POST') {
      return json({
        data: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 900,
        },
        error: null,
      });
    }
    if (segments[1] === 'me' && req.method === 'GET') {
      return currentUser
        ? json({ data: currentUser, error: null })
        : json({ message: 'Unauthorized' }, 401);
    }
    if (segments[1] === 'profile' && req.method === 'PUT') {
      if (!currentUser) return json({ message: 'Unauthorized' }, 401);
      currentUser = { ...currentUser, ...(req.body as object) } as User;
      return json({ data: currentUser, error: null });
    }
    if (segments[1] === 'change-password' && req.method === 'POST') {
      return json({ data: null, error: null });
    }
    if (segments[1] === 'logout' && req.method === 'POST') {
      currentUser = null;
      localStorage.removeItem('sg_mock_role');
      return json({ data: null, error: null });
    }
  }

  // ── Dashboard ────────────────────────────────────────────────────────────
  if (segments[0] === 'dashboard' && segments[1] === 'overview') {
    const overview =
      currentUser?.role === 'admin' ? buildAdminDashboard(mockSchools) : buildSchoolDashboard();
    return json({ data: overview, error: null });
  }

  // ── Schools ─────────────────────────────────────────────────────────────
  if (segments[0] === 'schools') {
    if (segments.length === 1) {
      if (req.method === 'GET') {
        let items = [...mockSchools];
        const search = params.get('search');
        if (search) items = items.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
        const schoolSystem = params.get('school_system');
        if (schoolSystem) items = items.filter((s) => s.schoolSystem === schoolSystem);
        const educationType = params.get('education_type');
        if (educationType) items = items.filter((s) => s.classes.some((c) => c.educationType === educationType));
        const specialtyId = params.get('specialty_id');
        if (specialtyId) {
          items = items.filter((s) => s.classes.some((c) => c.specialtyId === specialtyId));
        }
        return json(paginate(items, params));
      }
      if (req.method === 'POST') {
        const body = req.body as Record<string, unknown>;
        const cityId = Number(body['city_id'] ?? 0);
        const city = MOCK_REF_CITIES.find((c) => c.id === cityId);
        const system = (body['system'] as School['schoolSystem']) ?? 'francophone';
        const created: School = {
          id: `sch-${Date.now()}`,
          name: String(body['name'] ?? ''),
          city: city?.name ?? '',
          cityId,
          address: String(body['address'] ?? ''),
          phone: String(body['phone'] ?? ''),
          email: String(body['email'] ?? ''),
          status: (body['status'] as School['status']) ?? 'active',
          schoolSystem: system,
          academicYear: '2025-2026',
          classes: [],
          totalClasses: 0,
          fillRate: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockSchools.push(created);
        return json(created, 201);
      }
    }
    if (segments.length === 2 && req.method === 'GET') {
      const school = mockSchools.find((s) => s.id === segments[1]);
      return school ? json(school) : json({ message: 'Not found' }, 404);
    }
    if (segments.length === 2 && req.method === 'PUT') {
      const idx = mockSchools.findIndex((s) => s.id === segments[1]);
      if (idx === -1) return json({ message: 'Not found' }, 404);
      const updated = {
        ...mockSchools[idx],
        ...(req.body as object),
        id: segments[1],
        updatedAt: new Date().toISOString(),
      };
      mockSchools[idx] = updated;
      return json(updated);
    }
  }

  // ── Enrollments ──────────────────────────────────────────────────────────
  if (segments[0] === 'enrollments') {
    if (segments.length === 1 && req.method === 'GET') {
      let items = [...mockEnrollments];
      const schoolId = params.get('school_id');
      if (schoolId) {
        items = items.filter((e) => e.schoolId === schoolId);
      } else if (isSchoolUser() && currentUser?.schoolId) {
        items = items.filter((e) => e.schoolId === currentUser!.schoolId);
      }
      const status = params.get('status');
      if (status) items = items.filter((e) => e.status === status);
      const educationType = params.get('education_type');
      if (educationType) items = items.filter((e) => e.classEducationType === educationType);
      const specialtyId = params.get('specialty_id');
      if (specialtyId) items = items.filter((e) => e.classSpecialtyId === specialtyId);
      const paymentValidated = params.get('payment_validated');
      if (paymentValidated === 'true') {
        items = items.filter((e) => e.paymentValidated);
      }
      return json(paginate(items, params));
    }

    const enrollmentId = segments[1];

    if (segments[2] === 'accept' && req.method === 'POST') {
      const idx = mockEnrollments.findIndex((e) => e.id === enrollmentId);
      if (idx === -1) return json({ message: 'Not found' }, 404);
      mockEnrollments[idx] = { ...mockEnrollments[idx], status: 'active', updatedAt: new Date().toISOString() };
      return json(mockEnrollments[idx]);
    }

    if (segments[2] === 'reject' && req.method === 'POST') {
      const idx = mockEnrollments.findIndex((e) => e.id === enrollmentId);
      if (idx === -1) return json({ message: 'Not found' }, 404);
      const body = req.body as { reason: string };
      if (!body.reason) return json({ message: 'Reason required' }, 422);
      mockEnrollments[idx] = {
        ...mockEnrollments[idx],
        status: 'rejected',
        rejectionReason: body.reason,
        updatedAt: new Date().toISOString(),
      };
      return json(mockEnrollments[idx]);
    }

    if (segments[2] === 'documents' && segments[3] === 'confirm' && req.method === 'POST') {
      const idx = mockEnrollments.findIndex((e) => e.id === enrollmentId);
      if (idx === -1) return json({ message: 'Not found' }, 404);
      mockEnrollments[idx] = {
        ...mockEnrollments[idx],
        documentsReceived: true,
        status: 'pending',
        updatedAt: new Date().toISOString(),
      };
      return json(mockEnrollments[idx]);
    }

    if (segments.length === 2 && req.method === 'GET') {
      const enr = mockEnrollments.find((e) => e.id === enrollmentId);
      return enr ? json(enr) : json({ message: 'Not found' }, 404);
    }
  }

  // ── Payments ─────────────────────────────────────────────────────────────
  if (segments[0] === 'payments') {
    if (segments[1] === 'commission-summary' && req.method === 'GET') {
      if (currentUser?.role !== 'admin') return json({ message: 'Forbidden' }, 403);
      return json({ data: buildSchoolCommissionSummary(mockSchools) });
    }
    if (segments[1] === 'validate' && req.method === 'POST') return json(null);
    if (segments[1] === 'reject' && req.method === 'POST') return json(null);
    if (segments.length === 1 && req.method === 'GET') {
      let items = [...MOCK_PAYMENTS];
      if (isSchoolUser() && currentUser?.schoolId) {
        items = items.filter((p) => p.schoolId === currentUser!.schoolId);
      }
      const status = params.get('status');
      if (status) items = items.filter((p) => p.status === status);
      const educationType = params.get('education_type');
      if (educationType) items = items.filter((p) => p.classEducationType === educationType);
      const specialtyId = params.get('specialty_id');
      if (specialtyId) items = items.filter((p) => p.classSpecialtyId === specialtyId);
      return json(paginate(items, params));
    }
  }

  // ── Reference data ────────────────────────────────────────────────────────
  if (segments[0] === 'ref') {
    if (segments[1] === 'specialties' && req.method === 'GET') {
      return json({ data: MOCK_REF_SPECIALTIES });
    }
    if (segments[1] === 'levels' && req.method === 'GET') {
      const system = params.get('system');
      const type = params.get('type');
      const levels = MOCK_REF_LEVELS.filter((l) => {
        if (system && l.system !== system) return false;
        if (type && l.educationType !== type) return false;
        return true;
      });
      return json({ data: levels });
    }
  }

  if (segments[0] === 'reference' && segments[1] === 'cities' && req.method === 'GET') {
    const q = (params.get('q') ?? '').trim().toLowerCase();
    const cities = q
      ? MOCK_REF_CITIES.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.adminName.toLowerCase().includes(q),
        )
      : MOCK_REF_CITIES;
    return json({ data: cities });
  }

  // ── Invoices ─────────────────────────────────────────────────────────────
  if (segments[0] === 'invoices') {
    if (segments.length === 1 && req.method === 'GET') {
      let items = [...MOCK_INVOICES];
      if (isSchoolUser() && currentUser?.schoolId) {
        items = items.filter((i) => i.schoolId === currentUser!.schoolId);
      }
      const enrollmentId = params.get('enrollment_id');
      if (enrollmentId) {
        items = items.filter((i) => i.enrollmentId === enrollmentId);
      }
      return json(paginate(items, params));
    }
    if (segments.length >= 2 && req.method === 'GET') {
      if (segments[2] === 'verify') {
        return json({ valid: true, message: 'Invoice signature is authentic (mock).' });
      }
      const inv = MOCK_INVOICES.find((i) => i.id === segments[1]);
      return inv ? json(inv) : json({ message: 'Not found' }, 404);
    }
  }

  // ── Users ────────────────────────────────────────────────────────────────
  if (segments[0] === 'users') {
    if (req.method === 'GET') {
      return json(paginate([MOCK_ADMIN, MOCK_SCHOOL_ADMIN, MOCK_SCHOOL_EDITOR], params));
    }
    if (req.method === 'POST') {
      return json({ ...(req.body as object), id: `usr-${Date.now()}`, is_active: true }, 201);
    }
    if (segments.length === 2 && req.method === 'PUT') {
      return json({ ...(req.body as object), id: segments[1] });
    }
  }

  return null;
}

export const mockApiInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  if (!environment.useMockApi) return next(req);
  if (!req.url.startsWith(environment.apiBaseUrl) && !req.url.startsWith('/api/v1')) return next(req);

  const response = handleMock(req);
  if (response) return of(response as HttpEvent<unknown>).pipe(delay(MOCK_DELAY_MS));

  console.warn('[Mock API] Unhandled:', req.method, req.url);
  return of(json({ message: 'Mock route not implemented' }, 404)).pipe(delay(MOCK_DELAY_MS));
};

/**
 * Restore the mock session after a page refresh.
 *
 * The real access token is now memory-only (`InMemoryTokenStorage`) and is
 * gone after a reload by design, so this can no longer key off it. Instead it
 * mirrors the production flow: the app will call `/auth/refresh` at bootstrap
 * (see `AuthEffects.bootstrapSession`), and the mock `refresh` handler below
 * always succeeds — so restoring `currentUser` from the last known mock role
 * (a non-sensitive dev-only marker, not a token) is enough to keep that mock
 * refresh returning a coherent user for the rest of the session.
 */
export function initMockSession(): void {
  if (!environment.useMockApi) return;
  const role = localStorage.getItem('sg_mock_role');
  if (role === 'admin') currentUser = MOCK_ADMIN;
  else if (role === 'school_admin') currentUser = MOCK_SCHOOL_ADMIN;
  else if (role === 'school_editor') currentUser = MOCK_SCHOOL_EDITOR;
}
