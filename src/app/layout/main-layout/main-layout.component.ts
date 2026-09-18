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
import { selectUser } from '../../core/store/auth.reducer';
import { AuthActions } from '../../core/store/auth.actions';
import { LanguageService } from '../../core/services/language.service';
import { UserRole } from '../../shared/models/common.model';
import { User } from '../../core/models/auth.model';
import {
  HeaderNotification,
  HeaderNotificationsService,
} from '../../core/services/header-notifications.service';
import { SessionTimeoutService } from '../../core/services/session-timeout.service';
import { IconRailDrawerComponent } from '../../shared/components/icon-rail-drawer/icon-rail-drawer.component';
import { BrandLogoComponent } from '../../shared/components/brand-logo/brand-logo.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

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
  /**
   * Highlight only on an exact URL match. Needed for the two school entries:
   * `/schools/:id` is a prefix of `/schools/:id/edit`, so with the default
   * prefix matching both lit up at once.
   */
  exact?: boolean;
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
    BrandLogoComponent,
    ThemeToggleComponent,
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
  /** Quick jump to the schools list — the only entity with a global list an
   * admin can search from anywhere; scoped to that role for the same reason
   * the "Schools" nav item itself is admin-only. */
  readonly searchTerm = signal('');

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
      exact: true,
    },
    {
      label: 'NAV.CLASSES',
      icon: 'class',
      route: null,
      routeFn: (user) => `/schools/${user.schoolId}`,
      roles: ['school_admin'],
      exact: true,
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

  /** The entries this user may actually see. */
  visibleNav(user: User): NavItem[] {
    return this.navItems.filter((item) => this.isNavVisible(item, user.role));
  }

  /**
   * The phone bar shows the first five entries *the user can see*. The previous
   * code sliced before filtering, so an admin — whose visible entries are spread
   * across the list — ended up with only three.
   */
  bottomNav(user: User): NavItem[] {
    return this.visibleNav(user).slice(0, 5);
  }

  /** Initials for the account avatar, e.g. "Awa Nkomo" becomes "AN". */
  initials(user: User): string {
    const parts = (user.name || user.email || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    const letters = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0];
    return letters.toUpperCase();
  }

  get currentLang(): string {
    return this.languageService.getCurrentLanguage().toUpperCase();
  }

  toggleLanguage(): void {
    this.languageService.toggleLanguage();
  }

  submitSearch(): void {
    const term = this.searchTerm().trim();
    if (!term) return;
    void this.router.navigate(['/schools'], { queryParams: { search: term } });
  }

  openNotification(notification: HeaderNotification): void {
    this.headerNotifications.markAsRead(notification.id);
    void this.router.navigateByUrl(notification.route);
  }

  markAllNotificationsRead(): void {
    this.headerNotifications.markAllAsRead();
  }
}
