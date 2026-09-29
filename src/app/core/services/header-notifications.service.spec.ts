import { TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';

import { HeaderNotificationsService } from './header-notifications.service';
import { TokenStorage } from './token-storage';
import { AuthActions } from '../store/auth.actions';
import { User } from '../models/auth.model';
import { NotificationDto } from '../../api';
import { provideTestDefaults } from '../../../testing/test-providers';

/** Stands in for the browser WebSocket so tests can open, close and push messages. */
class FakeWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static instances: FakeWebSocket[] = [];

  readyState = FakeWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  closed = false;

  constructor(readonly url: string) {
    FakeWebSocket.instances.push(this);
  }

  open(): void {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }

  push(dto: NotificationDto): void {
    this.onmessage?.({ data: JSON.stringify(dto) });
  }

  /** The server or the network ending the connection. */
  drop(): void {
    this.readyState = 3;
    this.onclose?.();
  }

  close(): void {
    this.closed = true;
    this.readyState = 3;
  }

  static latest(): FakeWebSocket {
    return FakeWebSocket.instances[FakeWebSocket.instances.length - 1];
  }
}

const admin: User = {
  id: '1',
  email: 'admin@school.local',
  name: 'Admin',
  role: 'admin',
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
};
const schoolAdmin: User = { ...admin, id: '8', email: 'staff@school.local', role: 'school_admin' };

const resetRequest: NotificationDto = {
  id: 16,
  type: 'password_reset_requested',
  code: 'PASSWORD_RESET_REQUESTED',
  title: 'Password reset requested',
  body: 'server body',
  read: false,
  created_at: '2026-09-19T05:00:00Z',
  data: { user_id: 8, name: 'My Verifadmin', email: 'admin@verif.com', role: 'school_admin' },
};

describe('HeaderNotificationsService', () => {
  let service: HeaderNotificationsService;
  let http: HttpTestingController;
  let store: Store;
  let realWebSocket: typeof WebSocket;
  let latest: { items: { id: string; message: string }[]; unreadCount: number };

  beforeEach(() => {
    realWebSocket = window.WebSocket;
    FakeWebSocket.instances = [];
    (window as unknown as { WebSocket: unknown }).WebSocket = FakeWebSocket;

    TestBed.configureTestingModule({ providers: provideTestDefaults() });
    service = TestBed.inject(HeaderNotificationsService);
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(Store);
    TestBed.inject(TokenStorage).setAccessToken('access-token');

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      API_CODES: { PASSWORD_RESET_REQUESTED: '{{name}} ({{email}}) needs a reset' },
    });
    translate.use('en');
  });

  afterEach(() => {
    (window as unknown as { WebSocket: unknown }).WebSocket = realWebSocket;
  });

  const notificationRequests = (): TestRequest[] =>
    http.match((req) => req.url.endsWith('/notifications'));

  function signIn(user: User): void {
    store.dispatch(AuthActions.initSuccess({ user }));
  }

  function listen(): void {
    service.getNotifications().subscribe((state) => (latest = state));
  }

  it('says who is asking for a password reset', () => {
    signIn(admin);
    listen();
    notificationRequests().forEach((req) => req.flush({ code: 'OK', data: [resetRequest] }));

    expect(latest.items[0].message).toBe('My Verifadmin (admin@verif.com) needs a reset');
  });

  it('shows a notification pushed live on the socket', () => {
    signIn(admin);
    listen();
    notificationRequests().forEach((req) => req.flush({ code: 'OK', data: [] }));

    FakeWebSocket.latest().open();
    FakeWebSocket.latest().push(resetRequest);

    expect(latest.items.map((n) => n.id)).toEqual(['16']);
    expect(latest.unreadCount).toBe(1);
  });

  it('reconnects after the socket drops and re-reads what was missed', fakeAsync(() => {
    signIn(admin);
    listen();
    notificationRequests().forEach((req) => req.flush({ code: 'OK', data: [] }));
    FakeWebSocket.latest().open();

    FakeWebSocket.latest().drop();
    tick(1000);

    expect(FakeWebSocket.instances.length).toBe(2);
    FakeWebSocket.latest().open();
    const reseed = notificationRequests();
    expect(reseed.length).toBe(1);
    reseed[0].flush({ code: 'OK', data: [resetRequest] });
    expect(latest.items.map((n) => n.id)).toEqual(['16']);
    discardPeriodicTasks();
  }));

  it('keeps backing off while the server stays unreachable', fakeAsync(() => {
    signIn(admin);
    listen();
    notificationRequests().forEach((req) => req.flush({ code: 'OK', data: [] }));

    FakeWebSocket.latest().drop();
    tick(1000);
    FakeWebSocket.latest().drop();
    tick(1999);
    expect(FakeWebSocket.instances.length).toBe(2);
    tick(1);
    expect(FakeWebSocket.instances.length).toBe(3);
    discardPeriodicTasks();
  }));

  it('restarts the feed for the new user after logout then login in the same tab', () => {
    signIn(schoolAdmin);
    listen();
    notificationRequests().forEach((req) => req.flush({ code: 'OK', data: [] }));
    const staffSocket = FakeWebSocket.latest();

    store.dispatch(AuthActions.logoutSuccess());
    expect(staffSocket.closed).toBeTrue();

    signIn(admin);
    const seed = notificationRequests();
    expect(seed.length).toBe(1);
    seed[0].flush({ code: 'OK', data: [resetRequest] });

    expect(FakeWebSocket.latest()).not.toBe(staffSocket);
    expect(latest.items.map((n) => n.id)).toEqual(['16']);
  });

  it('does not reconnect after logout', fakeAsync(() => {
    signIn(admin);
    listen();
    notificationRequests().forEach((req) => req.flush({ code: 'OK', data: [] }));

    store.dispatch(AuthActions.logoutSuccess());
    tick(60_000);

    expect(FakeWebSocket.instances.length).toBe(1);
  }));

  it('loads only unread notifications', () => {
    signIn(admin);
    listen();

    const [seed] = notificationRequests();
    expect(seed.request.params.get('read')).toBe('false');
    seed.flush({ code: 'OK', data: [resetRequest], meta: { total: 1 } });
    expect(latest.unreadCount).toBe(1);
  });

  it('drops a notification from the bell once read', () => {
    signIn(admin);
    listen();
    notificationRequests().forEach((req) => req.flush({ code: 'OK', data: [resetRequest], meta: { total: 1 } }));

    service.markAsRead('16');
    http.match((req) => req.url.endsWith('/notifications/16/read')).forEach((req) => req.flush({}));

    expect(latest.items).toEqual([]);
    expect(latest.unreadCount).toBe(0);
  });

  it('empties the bell on "mark all as read"', () => {
    signIn(admin);
    listen();
    notificationRequests().forEach((req) => req.flush({ code: 'OK', data: [resetRequest], meta: { total: 1 } }));

    service.markAllAsRead();
    http.match((req) => req.url.endsWith('/notifications/read-all')).forEach((req) => req.flush({}));

    expect(latest.items).toEqual([]);
    expect(latest.unreadCount).toBe(0);
  });
});
