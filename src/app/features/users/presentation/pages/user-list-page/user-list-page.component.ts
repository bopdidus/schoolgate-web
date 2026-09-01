import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { UserRepository } from '../../../infrastructure/user.repository';
import { User } from '../../../../../core/auth/models/auth.model';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { SkeletonTableComponent } from '../../../../../shared/components/skeleton-table/skeleton-table.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { NotificationService } from '../../../../../core/notifications/notification.service';

@Component({
  selector: 'app-user-list-page',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatCardModule,
    TranslateModule,
    PageHeaderComponent,
    SkeletonTableComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-list-page.component.html',
})
export class UserListPageComponent implements OnInit {
  private readonly repository = inject(UserRepository);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(true);
  readonly users = signal<User[]>([]);
  readonly displayedColumns = ['name', 'email', 'role', 'school', 'active'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.repository.getAll().subscribe({
      next: (r) => {
        this.users.set(r.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreateDialog(): void {
    import('../user-create-dialog.component').then((m) => {
      this.dialog
        .open(m.UserCreateDialogComponent, { width: '480px' })
        .afterClosed()
        .subscribe((created) => {
          if (created) this.load();
        });
    });
  }

  toggleActive(user: User): void {
    this.repository.toggleActive(user.id, !user.isActive).subscribe({
      next: () => {
        this.notification.success('USERS.UPDATED_OK');
        this.load();
      },
    });
  }

  trackById(_: number, u: User): string {
    return u.id;
  }
}
