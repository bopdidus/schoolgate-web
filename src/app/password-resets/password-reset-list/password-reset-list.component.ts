import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';
import { PasswordResetService } from '../password-reset.service';
import { PasswordResetRequest, PasswordResetStatus } from '../password-reset.model';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SkeletonTableComponent } from '../../shared/components/skeleton-table/skeleton-table.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { LocaleDatePipe } from '../../shared/pipes/locale-date.pipe';

/** `all` lists both statuses; the others map to the API's status filter. */
export type PasswordResetView = PasswordResetStatus | 'all';

@Component({
  selector: 'app-password-reset-list',
  standalone: true,
  imports: [
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    TranslateModule,
    PageHeaderComponent,
    SkeletonTableComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    LocaleDatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './password-reset-list.component.html',
  styleUrl: './password-reset-list.component.scss',
})
export class PasswordResetListComponent implements OnInit {
  private readonly passwordResetService = inject(PasswordResetService);

  readonly loading = signal(true);
  /** Separates a failed request from a genuinely empty list. */
  readonly failed = signal(false);
  readonly requests = signal<PasswordResetRequest[]>([]);
  readonly total = signal(0);
  readonly page = signal(0);
  readonly pageSize = signal(10);
  /** Opens on what still needs doing. */
  readonly view = signal<PasswordResetView>('pending');

  readonly displayedColumns = ['name', 'email', 'role', 'requestedAt', 'status', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    const view = this.view();
    this.passwordResetService
      .getAll({
        status: view === 'all' ? undefined : view,
        page: this.page() + 1,
        pageSize: this.pageSize(),
      })
      .subscribe({
        next: (r) => {
          this.requests.set(r.data);
          this.total.set(r.total);
          this.loading.set(false);
        },
        error: () => {
          this.failed.set(true);
          this.loading.set(false);
        },
      });
  }

  onViewChange(view: PasswordResetView): void {
    this.view.set(view);
    this.page.set(0);
    this.load();
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  /** Translation key for the requester's role; null when unknown. */
  roleLabel(role: PasswordResetRequest['role']): string | null {
    switch (role) {
      case 'school_admin':
        return 'USERS.SCHOOL_ADMIN';
      case 'school_editor':
        return 'USERS.SCHOOL_EDITOR';
      default:
        return null;
    }
  }

  trackById(_: number, r: PasswordResetRequest): string {
    return r.id;
  }
}
