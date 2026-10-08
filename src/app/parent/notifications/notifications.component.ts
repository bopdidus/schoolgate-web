import { Component, ChangeDetectionStrategy, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { TranslateModule } from '@ngx-translate/core';
import { NotificationDto, NotificationsService } from '../../api';
import { pageToOffset, unwrapData } from '../../core/utils/openapi-helpers';
import { ApiCodeService } from '../../core/services/api-code.service';
import { HeaderNotificationsService, parentNotificationRoute } from '../../core/services/header-notifications.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { SkeletonTableComponent } from '../../shared/components/skeleton-table/skeleton-table.component';
import { LocaleDatePipe } from '../../shared/pipes/locale-date.pipe';

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  route: string;
  icon: string;
}

const PAGE_SIZE = 20;

function iconFor(type?: string): string {
  if (type?.startsWith('payment_')) return type === 'payment_validated' ? 'paid' : 'payments';
  if (type === 'enrollment_accepted') return 'check_circle';
  if (type === 'enrollment_rejected') return 'cancel';
  return 'notifications';
}

/** Every notification of the account, read or not (mobile notifications tab). */
@Component({
  selector: 'app-parent-notifications',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    TranslateModule,
    PageHeaderComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    SkeletonTableComponent,
    LocaleDatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
})
export class NotificationsComponent implements OnInit {
  private readonly notificationsApi = inject(NotificationsService);
  private readonly apiCodes = inject(ApiCodeService);
  private readonly bell = inject(HeaderNotificationsService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly rows = signal<NotificationRow[]>([]);
  readonly total = signal(0);
  readonly page = signal(0);
  readonly pageSize = PAGE_SIZE;
  readonly hasUnread = computed(() => this.rows().some((r) => !r.read));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    const { limit, offset } = pageToOffset(this.page() + 1, PAGE_SIZE);
    this.notificationsApi.notificationsGet(limit, offset).subscribe({
      next: (envelope) => {
        this.rows.set((unwrapData(envelope) ?? []).map((dto) => this.toRow(dto)));
        this.total.set(envelope.meta?.total ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  onPage(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.load();
  }

  open(row: NotificationRow): void {
    if (!row.read) {
      this.bell.markAsRead(row.id);
      this.rows.update((rows) => rows.map((r) => (r.id === row.id ? { ...r, read: true } : r)));
    }
    void this.router.navigateByUrl(row.route);
  }

  markAllRead(): void {
    this.bell.markAllAsRead();
    this.rows.update((rows) => rows.map((r) => ({ ...r, read: true })));
  }

  private toRow(dto: NotificationDto): NotificationRow {
    return {
      id: String(dto.id ?? ''),
      title: String(dto.title ?? ''),
      // Localized catalog text first; the server's body is the fallback.
      message: this.apiCodes.translateCode(dto.code, dto.data as Record<string, unknown>) ?? String(dto.body ?? ''),
      createdAt: String(dto.created_at ?? ''),
      read: dto.read ?? false,
      route: parentNotificationRoute(dto),
      icon: iconFor(dto.type),
    };
  }
}
