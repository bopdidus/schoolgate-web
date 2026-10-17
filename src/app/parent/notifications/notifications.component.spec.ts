import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { NotificationsComponent } from './notifications.component';
import { provideTestDefaults } from '../../../testing/test-providers';
import { NotificationsService } from '../../api';
import { HeaderNotificationsService } from '../../core/services/header-notifications.service';
import { ApiCodeService } from '../../core/services/api-code.service';

describe('NotificationsComponent', () => {
  let fixture: ComponentFixture<NotificationsComponent>;
  let bell: jasmine.SpyObj<HeaderNotificationsService>;

  beforeEach(async () => {
    bell = jasmine.createSpyObj<HeaderNotificationsService>('HeaderNotificationsService', ['markAsRead', 'markAllAsRead']);
    await TestBed.configureTestingModule({
      imports: [NotificationsComponent],
      providers: [
        ...provideTestDefaults(),
        {
          provide: NotificationsService,
          useValue: {
            notificationsGet: () =>
              of({
                data: [
                  { id: 1, type: 'payment_validated', code: 'PAYMENT_VALIDATED', body: 'server text', read: false, data: { enrollment_id: 3 } },
                  { id: 2, type: 'enrollment_accepted', body: 'Accepted', read: true },
                ],
                meta: { total: 2 },
              }),
          },
        },
        { provide: HeaderNotificationsService, useValue: bell },
        { provide: ApiCodeService, useValue: { translateCode: (code?: string) => (code ? `T:${code}` : null) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(NotificationsComponent);
    fixture.detectChanges();
  });

  it('shows the localized text, an icon per kind, and whether some are unread', () => {
    const c = fixture.componentInstance;
    expect(c.rows()[0]).toEqual(jasmine.objectContaining({ message: 'T:PAYMENT_VALIDATED', icon: 'paid', read: false }));
    expect(c.rows()[1]).toEqual(jasmine.objectContaining({ message: 'Accepted', icon: 'check_circle' }));
    expect(c.hasUnread()).toBeTrue();
    expect(c.total()).toBe(2);
  });

  it('marks a notification read when opened, then all of them', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    const c = fixture.componentInstance;
    c.open(c.rows()[0]);
    expect(bell.markAsRead).toHaveBeenCalledWith('1');
    expect(router.navigateByUrl).toHaveBeenCalled();
    c.markAllRead();
    expect(bell.markAllAsRead).toHaveBeenCalled();
    expect(c.hasUnread()).toBeFalse();
  });
});
