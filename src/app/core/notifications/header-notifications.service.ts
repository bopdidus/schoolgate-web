import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  NotificationsService,
  NotificationDto,
  NotificationListEnvelopeDto,
} from '../../api';
import { environment } from '../../../environments/environment';
import { unwrapData } from '../api/openapi-helpers';
import { of } from 'rxjs';

export interface HeaderNotification {
  id: string;
  title: string;
  message: string;
  route: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class HeaderNotificationsService {
  private readonly notificationsApi = inject(NotificationsService);

  getNotifications(): Observable<{ items: HeaderNotification[]; unreadCount: number }> {
    if (environment.useMockApi) {
      return of({
        items: MOCK_NOTIFICATIONS,
        unreadCount: MOCK_NOTIFICATIONS.length,
      });
    }
    return this.notificationsApi.notificationsGet().pipe(
      map((envelope: NotificationListEnvelopeDto) => {
        const items = (unwrapData(envelope) ?? []).map((n) => this.mapNotification(n));
        const unreadCount = (envelope.data ?? []).filter((n) => !n.read).length;
        return { items, unreadCount };
      }),
    );
  }

  private mapNotification(dto: NotificationDto): HeaderNotification {
    return {
      id: String(dto.id ?? ''),
      title: String(dto.title ?? ''),
      message: String(dto.body ?? ''),
      route: this.routeForType(dto.type),
      createdAt: String(dto.created_at ?? ''),
    };
  }

  private routeForType(type?: string): string {
    switch (type) {
      case 'payment_declared':
      case 'payment_validated':
      case 'payment_rejected':
        return '/payments';
      case 'enrollment_pending':
      case 'enrollment_accepted':
      case 'enrollment_rejected':
        return '/enrollments';
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
  },
  {
    id: 'notif-2',
    title: 'Payment to validate',
    message: 'Jean Dupont — enrollment fee declared',
    route: '/payments',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'notif-3',
    title: 'Place request',
    message: 'Paul Essomba — awaiting acceptance',
    route: '/enrollments',
    createdAt: new Date().toISOString(),
  },
];
