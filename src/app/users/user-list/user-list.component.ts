import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { UserService } from '../user.service';
import { User } from '../../core/models/auth.model';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SkeletonTableComponent } from '../../shared/components/skeleton-table/skeleton-table.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    TranslateModule,
    PageHeaderComponent,
    SkeletonTableComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  /** Separates a failed request from a genuinely empty list. */
  readonly failed = signal(false);
  readonly users = signal<User[]>([]);
  readonly displayedColumns = ['name', 'email', 'role', 'school'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.userService.getAll().subscribe({
      next: (r) => {
        this.users.set(r.data);
        this.loading.set(false);
      },
      error: () => {
          this.failed.set(true);
          this.loading.set(false);
        },
    });
  }

  /** The whole row opens the user; the name link keeps it reachable by keyboard. */
  open(user: User): void {
    void this.router.navigate(['/users', user.id]);
  }

  openCreateDialog(): void {
    import('../user-create-dialog/user-create-dialog.component').then((m) => {
      this.dialog
        .open(m.UserCreateDialogComponent, { width: '480px' })
        .afterClosed()
        .subscribe((created) => {
          if (created) this.load();
        });
    });
  }

  trackById(_: number, u: User): string {
    return u.id;
  }
}
