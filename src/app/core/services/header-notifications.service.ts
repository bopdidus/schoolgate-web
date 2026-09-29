import { Injectable, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of, Subscription, timer } from 'rxjs';
import { distinctUntilChanged, filter, map, take } from 'rxjs/operators';
import {
  NotificationsService,
  NotificationDto,
  NotificationListEnvelopeDto,
} from '../../api';
import { environment } from '../../../environments/environment';
import { unwrapData } from '../utils/openapi-helpers';
import { TokenStorage } from './token-storage';
import { ApiCodeService } from './api-code.service';
import { NotificationService } from './notification.service';
import { selectUser } from '../store/auth.reducer';
import { User } from '../models/auth.model';

export interface HeaderNotification {
  id: string;
  title: string;
  message: string;
  route: string;
  createdAt: string;
  type?: string;
  read?: boolean;
}

const MAX_RECONNECT_DELAY_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class HeaderNotificationsService implements OnDestroy {
  private readonly notificationsApi = inject(NotificationsService);
  private readonly tokenStorage = inject(TokenStorage);
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly apiCodes = inject(ApiCodeService);
  private readonly toasts = inject(NotificationService);

  private readonly state$ = new BehaviorSubject<{
    items: HeaderNotification[];
    unreadCount: number;
  }>({ items: [], unreadCount: 0 });

  private socket: WebSocket | null = null;
  private started = false;
  private tokenWaitSub: Subscription | null = null;
  private seedSub: Subscription | null = null;
  private reconnectSub: Subscription | null = null;
  private reconnectAttempts = 0;
  private readonly userSubs = new Subscription();
  private currentUser: User | null = null;

  /**
   * Seeds from HTTP GET, then keeps emitting live WebSocket updates for the
   * signed-in user. The feed follows the session: it restarts on a user change
   * (logout then login in the same tab) and reconnects after the socket drops.
   * Fallback: if WS is unavailable, the HTTP snapshot remains the source of truth.
   */
  getNotifications(): Observable<{ items: HeaderNotification[]; unreadCount: number }> {
    if (environment.useMockApi) {
      return of({
        items: MOCK_NOTIFICATIONS,
        unreadCount: MOCK_NOTIFICATIONS.length,
      });
    }

    if (!this.started) {
      this.started = true;
      const user$ = this.store.select(selectUser);
      this.userSubs.add(user$.subscribe((user) => (this.currentUser = user)));
      // Keyed on the id only: a profile update must not restart the feed.
      this.userSubs.add(
        user$
          .pipe(
            map((user) => user?.id ?? null),
            distinctUntilChanged(),
          )
          .subscribe((userId) => this.restartFor(userId)),
      );
    }

    return this.state$.asObservable();
  }

  ngOnDestroy(): void {
    this.userSubs.unsubscribe();
    this.stop();
  }

  /**
   * Drops everything tied to the previous user — list, pending seed, socket —
   * so a new login never shows (or keeps receiving) someone else's feed.
   */
  private restartFor(userId: string | null): void {
    this.stop();
    this.state$.next({ items: [], unreadCount: 0 });
    if (userId == null) return;
    this.seedFromHttp();
    this.connectWebSocket();
  }

  private stop(): void {
    this.tokenWaitSub?.unsubscribe();
    this.tokenWaitSub = null;
    this.seedSub?.unsubscribe();
    this.seedSub = null;
    this.reconnectSub?.unsubscribe();
    this.reconnectSub = null;
    this.reconnectAttempts = 0;
    this.disconnectWebSocket();
  }

  /**
   * Marks one notification read. The bell only lists unread ones, so it
   * leaves the list (badge stays reliable across sessions).
   */
  markAsRead(id: string): void {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      return;
    }
    const current = this.state$.value;
    const wasListed = current.items.some((n) => n.id === id);
    this.state$.next({
      items: current.items.filter((n) => n.id !== id),
      unreadCount: Math.max(0, current.unreadCount - (wasListed ? 1 : 0)),
    });
    this.notificationsApi.notificationsIdReadPost(numericId).subscribe({ error: () => undefined });
  }

  /** Marks everything read (bulk action from the header menu), emptying the bell. */
  markAllAsRead(): void {
    this.state$.next({ items: [], unreadCount: 0 });
    this.notificationsApi.notificationsReadAllPost().subscribe({ error: () => undefined });
  }

  private seedFromHttp(): void {
    this.seedSub?.unsubscribe();
    // Unread only: a read notification has nothing left to act on.
    this.seedSub = this.notificationsApi.notificationsGet(undefined, undefined, undefined, false).subscribe({
      next: (envelope: NotificationListEnvelopeDto) => {
        const rows = unwrapData(envelope) ?? [];
        const items = rows
          .map((n) => this.mapNotification(n))
          .filter((n): n is HeaderNotification => n != null);
        // The badge counts every unread notification, not just the listed
        // page, minus the ones this staff app never shows.
        const hiddenInPage = rows.length - items.length;
        const unreadCount = Math.max(items.length, (envelope.meta?.total ?? rows.length) - hiddenInPage);
        this.state$.next({ items, unreadCount });
      },
    });
  }

  private connectWebSocket(): void {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const token = this.tokenStorage.getAccessToken();
    if (!token) {
      this.tokenWaitSub?.unsubscribe();
      this.tokenWaitSub = this.tokenStorage.accessToken$
        .pipe(
          filter((t): t is string => !!t),
          take(1),
        )
        .subscribe(() => this.connectWebSocket());
      return;
    }

    const wsUrl = this.toWebSocketUrl(environment.apiBaseUrl);
    try {
      this.socket = new WebSocket(`${wsUrl}?token=${encodeURIComponent(token)}`);
    } catch {
      return;
    }

    this.socket.onmessage = (event) => {
      try {
        const dto = JSON.parse(String(event.data)) as NotificationDto;
        if (dto.read || !this.isForCurrentSchool(dto)) return;
        const mapped = this.mapNotification(dto);
        if (!mapped) return;
        const current = this.state$.value;
        const items = [mapped, ...current.items.filter((n) => n.id !== mapped.id)];
        this.state$.next({
          items,
          unreadCount: current.unreadCount + 1,
        });
        this.toasts.infoWithAction(mapped.message, 'COMMON.VIEW', () => {
          this.markAsRead(mapped.id);
          void this.router.navigateByUrl(mapped.route);
        });
      } catch {
        // Ignore malformed payloads.
      }
    };

    this.socket.onopen = () => {
      // Anything sent while the socket was down only exists server-side:
      // re-read the list after a reconnect so it is not silently missed.
      if (this.reconnectAttempts > 0) {
        this.seedFromHttp();
      }
      this.reconnectAttempts = 0;
    };

    // Fires after errors too (including a rejected upgrade, e.g. an expired
    // access token), so reconnecting from here covers every way the socket ends.
    this.socket.onclose = () => {
      this.socket = null;
      this.scheduleReconnect();
    };
  }

  /** Exponential backoff (1s, 2s, 4s… capped at 30s) while a user is signed in. */
  private scheduleReconnect(): void {
    if (!this.currentUser) return;
    const delayMs = Math.min(MAX_RECONNECT_DELAY_MS, 1000 * 2 ** this.reconnectAttempts);
    this.reconnectAttempts++;
    this.reconnectSub?.unsubscribe();
    this.reconnectSub = timer(delayMs).subscribe(() => this.connectWebSocket());
  }

  private disconnectWebSocket(): void {
    if (this.socket) {
      // Detached first: an intentional close must not schedule a reconnect.
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
  }

  /** `http(s)://host/api/v1` → `ws(s)://host/api/v1/ws` */
  private toWebSocketUrl(apiBaseUrl: string): string {
    const base = apiBaseUrl.replace(/\/$/, '');
    if (base.startsWith('https://')) {
      return `wss://${base.slice('https://'.length)}/ws`;
    }
    if (base.startsWith('http://')) {
      return `ws://${base.slice('http://'.length)}/ws`;
    }
    const protocol =
      typeof location !== 'undefined' && location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = typeof location !== 'undefined' ? location.host : 'localhost';
    const path = base.startsWith('/') ? base : `/${base}`;
    return `${protocol}//${host}${path}/ws`;
  }

  /**
   * Defensive guard: the API already targets recipients, but a notification
   * carrying another school's id must never surface for school staff.
   * Platform admins see everything; payloads without school context pass.
   */
  private isForCurrentSchool(dto: NotificationDto): boolean {
    const schoolId = dto.data?.['school_id'];
    if (schoolId == null) {
      return true;
    }
    const user = this.currentUser;
    if (!user || user.role === 'admin') {
      return true;
    }
    return user.schoolId != null && String(schoolId) === String(user.schoolId);
  }

  private mapNotification(dto: NotificationDto): HeaderNotification | null {
    // Parent-facing prompt — staff web app ignores it.
    if (dto.type === 'payment_requested') {
      return null;
    }
    const route = this.routeForType(dto.type);
    if (!route) {
      return null;
    }
    // Prefer the localized catalog text; server title/body remain a fallback.
    // The payload (name, email…) fills the text's placeholders, so e.g. a
    // password reset request says who is asking.
    const localized = this.apiCodes.translateCode(dto.code, dto.data as Record<string, unknown>);
    return {
      id: String(dto.id ?? ''),
      title: String(dto.title ?? ''),
      message: localized ?? String(dto.body ?? ''),
      route,
      createdAt: String(dto.created_at ?? ''),
      type: dto.type,
      read: dto.read ?? false,
    };
  }

  private routeForType(type?: string): string | null {
    switch (type) {
      case 'payment_validated':
      case 'payment_rejected':
      case 'payment_failed':
      case 'payment_declared':
        return '/payments';
      case 'enrollment_pending':
      case 'enrollment_accepted':
      case 'enrollment_rejected':
        return '/enrollments';
      case 'password_reset_requested':
        return '/password-resets';
      case 'school_registered':
        return '/schools?status=pending';
      case 'payment_requested':
        return null;
      default:
        return '/dashboard';
    }
  }
}

const MOCK_NOTIFICATIONS: HeaderNotification[] = [
  {
    id: 'notif-1',
    title: 'Place request',
    message: 'Amina Bello — documents pending review',
    route: '/enrollments',
    createdAt: new Date().toISOString(),
    type: 'enrollment_pending',
  },
  {
    id: 'notif-2',
    title: 'Payment validated',
    message: 'Jean Dupont — enrollment fee confirmed',
    route: '/payments',
    createdAt: new Date().toISOString(),
    type: 'payment_validated',
  },
  {
    id: 'notif-3',
    title: 'Place request',
    message: 'Paul Essomba — awaiting acceptance',
    route: '/enrollments',
    createdAt: new Date().toISOString(),
    type: 'enrollment_pending',
  },
];
