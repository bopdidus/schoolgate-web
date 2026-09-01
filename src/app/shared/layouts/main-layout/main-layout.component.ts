import { AsyncPipe } from '@angular/common';
import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDrawerContainer, MatDrawerContent } from '@angular/material/sidenav';
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
import { IconRailDrawerComponent } from '../../components/icon-rail-drawer/icon-rail-drawer.component';

const MOBILE_QUERY = '(max-width: 768px)';
const TABLET_QUERY = '(min-width: 769px) and (max-width: 1024px)';

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
    MatDrawerContainer,
    MatDrawerContent,
    IconRailDrawerComponent,
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
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly destroyRef = inject(DestroyRef);
  readonly router = inject(Router);
  readonly languageService = inject(LanguageService);

  readonly user$ = this.store.select(selectUser);
  /** Manual collapse requested through the toolbar toggle. */
  readonly collapsed = signal(false);
  /** Phone layout: the drawer is dropped in favor of the bottom nav. */
  readonly isMobile = signal(false);
  /** Tablet widths automatically fall back to the icon rail. */
  readonly autoRail = signal(false);
  /** Effective rail state driving both the drawer and the icon-only rendering. */
  readonly railActive = computed(() => this.collapsed() || this.autoRail());
  readonly notifications = signal<HeaderNotification[]>([]);
  readonly notificationCount = signal(0);

  ngOnInit(): void {
    this.headerNotifications.getNotifications().subscribe(({ items, unreadCount }) => {
      this.notifications.set(items);
      this.notificationCount.set(unreadCount);
    });
    this.breakpointObserver
      .observe([MOBILE_QUERY, TABLET_QUERY])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        this.isMobile.set(state.breakpoints[MOBILE_QUERY]);
        this.autoRail.set(state.breakpoints[TABLET_QUERY]);
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
      label: 'NAV.CLASSES',
      icon: 'class',
      route: null,
      routeFn: (user) => `/schools/${user.schoolId}`,
      roles: ['school_admin'],
    },
    {
      label: 'NAV.ENROLLMENTS',
      icon: 'groups',
      route: '/enrollments',
      roles: ['admin', 'school_admin', 'school_editor'],
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
    this.headerNotifications.markAsRead(notification.id);
    void this.router.navigateByUrl(notification.route);
  }

  markAllNotificationsRead(): void {
    this.headerNotifications.markAllAsRead();
  }
}
