import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { DashboardService } from './dashboard.service';
import { DashboardService as DashboardApiService } from '../api';

describe('DashboardService', () => {
  let api: jasmine.SpyObj<DashboardApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<DashboardApiService>('DashboardApiService', ['dashboardOverviewGet']);
    TestBed.configureTestingModule({ providers: [{ provide: DashboardApiService, useValue: api }] });
  });

  it('maps stats, classes, recent payments and the trend', (done) => {
    api.dashboardOverviewGet.and.returnValue(
      of({
        data: {
          role: 'school_admin',
          pending_payments_count: 2,
          validated_payments_count: 5,
          aggregate_filled_percent: 40,
          school_classes: [{ school_class_name: '6ème', validated_count: 3 }],
          recent_payments: [{ id: 7, student_name: 'Ada', amount_cents: 1_000_000, status: 'declared', declared_at: '2026-10-17', manual: true }],
          enrollment_trend: [{ date: '2026-10-16', count: 4 }],
        },
      }) as never,
    );
    TestBed.inject(DashboardService)
      .getOverview()
      .subscribe((o) => {
        expect(o.stats).toEqual({ pendingValidations: 2, validatedPayments: 5, seatsFilledPercent: 40 });
        expect(o.classPaymentStats).toEqual([{ className: '6ème', validated: 3, pending: 0 }]);
        expect(o.recentPayments?.[0]).toEqual(
          jasmine.objectContaining({ id: '7', amount: 10000, manual: true }),
        );
        expect(o.enrollmentTrend).toEqual([{ date: '2026-10-16', count: 4 }]);
        expect(o.pendingPasswordResetRequests).toBeUndefined();
        done();
      });
  });

  it('keeps the admin-only counters when the API sends them', (done) => {
    api.dashboardOverviewGet.and.returnValue(
      of({ data: { role: 'admin', pending_password_reset_requests_count: 0, pending_school_registrations_count: 3 } }) as never,
    );
    TestBed.inject(DashboardService)
      .getOverview()
      .subscribe((o) => {
        expect(o.role).toBe('admin');
        expect(o.pendingPasswordResetRequests).toBe(0);
        expect(o.pendingSchoolRegistrations).toBe(3);
        expect(o.recentPayments).toEqual([]);
        done();
      });
  });
});
