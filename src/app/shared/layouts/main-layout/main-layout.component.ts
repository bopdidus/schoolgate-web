import { AsyncPipe } from '@angular/common';
import { Component, inject, signal, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { MatDrawerContainer, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { selectUser } from '../../../core/auth/store/auth.reducer';
import { AuthActions } from '../../../core/auth/store/auth.actions';
import { LanguageService } from '../../../core/i18n/language.service';
import { UserRole } from '../../../shared/models/common.model';
import { User } from '../../../core/auth/models/auth.model';
import {
  HeaderNotification,
  HeaderNotificationsService,
} from '../../../core/notifications/header-notifications.service';
import { SessionTimeoutService } from '../../../core/auth/application/session-timeout.service';

interface NavItem {
  label: string;
  icon: string;
  /** Static route OR null when route is computed dynamically per user */
  route: string | null;
  /** Dynamic route builder — used when route is null */
  routeFn?: (user: User) => string;
  roles: UserRole[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslateModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly headerNotifications = inject(HeaderNotificationsService);
  private readonly sessionTimeout = inject(SessionTimeoutService);
  readonly router = inject(Router);
  readonly languageService = inject(LanguageService);

  readonly user$ = this.store.select(selectUser);
  readonly collapsed = signal(false);
  readonly notifications = signal<HeaderNotification[]>([]);
  readonly notificationCount = signal(0);

  ngOnInit(): void {
    this.headerNotifications.getNotifications().subscribe(({ items, unreadCount }) => {
      this.notifications.set(items);
      this.notificationCount.set(unreadCount);
    });
    // This layout only wraps authenticated routes (see `app.routes.ts`), so
    // starting/stopping the idle watcher here naturally excludes `/login` and
    // other public routes from the timeout without any extra route checks.
    this.sessionTimeout.start();
  }

  ngOnDestroy(): void {
    this.sessionTimeout.stop();
  }

  /** Max 7 nav items per Miller's Law. */
  readonly navItems: NavItem[] = [
    {
      label: 'NAV.DASHBOARD',
      icon: 'dashboard',
      route: '/dashboard',
      roles: ['admin', 'school_admin', 'school_editor'],
    },
    {
      label: 'NAV.SCHOOLS',
      icon: 'school',
      route: '/schools',
      roles: ['admin'],
    },
    {
      label: 'NAV.MY_SCHOOL',
      icon: 'domain',
      route: null,
      routeFn: (user) =>
        user.role === 'school_admin'
          ? `/schools/${user.schoolId}/edit`
          : `/schools/${user.schoolId}`,
      roles: ['school_admin', 'school_editor'],
    },
    {
      label: 'NAV.ENROLLMENTS',
      icon: 'groups',
      route: '/enrollments',
      roles: ['school_admin', 'school_editor'],
    },
    {
      label: 'NAV.PAYMENTS',
      icon: 'payments',
      route: '/payments',
      roles: ['admin', 'school_admin', 'school_editor'],
    },
    {
      label: 'NAV.USERS',
      icon: 'manage_accounts',
      route: '/users',
      roles: ['admin'],
    },
    {
      label: 'NAV.SETTINGS',
      icon: 'settings',
      route: '/settings',
      roles: ['admin', 'school_admin', 'school_editor'],
    },
  ];

  resolveRoute(item: NavItem, user: User): string {
    if (item.route) return item.route;
    if (item.routeFn) {
      const route = item.routeFn(user);
      return route.includes('undefined') ? '/dashboard' : route;
    }
    return '/dashboard';
  }

  toggleSidebar(): void {
    this.collapsed.update((v) => !v);
  }

  /**
   * The drawer width change is a pure CSS transition (see `.layout-sidenav` in the stylesheet),
   * so Angular Material's own margin calculation for `mat-drawer-content` — which only runs on
   * change-detection cycles — captures a stale mid-transition width. Without this, a gap/overlap
   * remains between the collapsed drawer and the toolbar once the animation settles.
   */
  onSidenavTransitionEnd(event: TransitionEvent, drawerContainer: MatDrawerContainer): void {
    if (event.propertyName === 'width') {
      drawerContainer.updateContentMargins();
    }
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }

  isNavVisible(item: NavItem, role: UserRole | undefined): boolean {
    return !!role && item.roles.includes(role);
  }

  get currentLang(): string {
    return this.languageService.getCurrentLanguage().toUpperCase();
  }

  toggleLanguage(): void {
    this.languageService.toggleLanguage();
  }

  openNotification(notification: HeaderNotification): void {
    void this.router.navigateByUrl(notification.route);
  }
}
