import { Injectable, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import {
  NotificationsService,
  NotificationDto,
  NotificationListEnvelopeDto,
} from '../../api';
import { environment } from '../../../environments/environment';
import { unwrapData } from '../api/openapi-helpers';
import { TokenStorage } from '../auth/token-storage/token-storage.interface';
import { ApiCodeService } from '../api/api-code.service';
import { NotificationService } from './notification.service';
import { selectUser } from '../auth/store/auth.reducer';
import { User } from '../auth/models/auth.model';

export interface HeaderNotification {
  id: string;
  title: string;
  message: string;
  route: string;
  createdAt: string;
  type?: string;
  read?: boolean;
}

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
  private seeded = false;
  private tokenWaitSub: Subscription | null = null;
  private userSub: Subscription | null = null;
  private currentUser: User | null = null;

  /**
   * Seeds from HTTP GET once, then keeps emitting live WebSocket updates.
   * Fallback: if WS is unavailable, the HTTP snapshot remains the source of truth.
   */
  getNotifications(): Observable<{ items: HeaderNotification[]; unreadCount: number }> {
    if (environment.useMockApi) {
      return of({
        items: MOCK_NOTIFICATIONS,
        unreadCount: MOCK_NOTIFICATIONS.length,
      });
    }

    if (!this.seeded) {
      this.seeded = true;
      this.userSub = this.store
        .select(selectUser)
        .subscribe((user) => (this.currentUser = user));
      this.seedFromHttp();
      this.connectWebSocket();
    }

    return this.state$.asObservable();
  }

  ngOnDestroy(): void {
    this.tokenWaitSub?.unsubscribe();
    this.userSub?.unsubscribe();
    this.disconnectWebSocket();
  }

  /** Marks one notification read (badge stays reliable across sessions). */
  markAsRead(id: string): void {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      return;
    }
    const current = this.state$.value;
    const wasUnread = current.items.some((n) => n.id === id && !n.read);
    this.state$.next({
      items: current.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(0, current.unreadCount - (wasUnread ? 1 : 0)),
    });
    this.notificationsApi.notificationsIdReadPost(numericId).subscribe({ error: () => undefined });
  }

  /** Marks everything read (bulk action from the header menu). */
  markAllAsRead(): void {
    const current = this.state$.value;
    this.state$.next({
      items: current.items.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    });
    this.notificationsApi.notificationsReadAllPost().subscribe({ error: () => undefined });
  }

  private seedFromHttp(): void {
    this.notificationsApi.notificationsGet().subscribe({
      next: (envelope: NotificationListEnvelopeDto) => {
        const items = (unwrapData(envelope) ?? [])
          .map((n) => this.mapNotification(n))
          .filter((n): n is HeaderNotification => n != null);
        const unreadCount = (envelope.data ?? []).filter(
          (n) => !n.read && n.type !== 'payment_requested',
        ).length;
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
        if (!this.isForCurrentSchool(dto)) return;
        const mapped = this.mapNotification(dto);
        if (!mapped) return;
        const current = this.state$.value;
        const items = [mapped, ...current.items.filter((n) => n.id !== mapped.id)];
        this.state$.next({
          items,
          unreadCount: current.unreadCount + (dto.read ? 0 : 1),
        });
        this.toasts.infoWithAction(mapped.message, 'COMMON.VIEW', () => {
          this.markAsRead(mapped.id);
          void this.router.navigateByUrl(mapped.route);
        });
      } catch {
        // Ignore malformed payloads.
      }
    };

    this.socket.onclose = () => {
      this.socket = null;
    };

    this.socket.onerror = () => {
      this.disconnectWebSocket();
    };
  }

  private disconnectWebSocket(): void {
    if (this.socket) {
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
    const localized = this.apiCodes.translateCode(dto.code);
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
