import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { SkeletonTableComponent } from '../../shared/components/skeleton-table/skeleton-table.component';
import { StatusColorPipe } from '../../shared/pipes/status-color.pipe';
import { LocaleDatePipe } from '../../shared/pipes/locale-date.pipe';
import { ParentEnrollment } from '../domain/models';
import { ParentEnrollmentsService } from '../services/parent-enrollments.service';

/** Every place request of the account, newest first (mobile "My requests"). */
@Component({
  selector: 'app-parent-requests',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    TranslateModule,
    PageHeaderComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    SkeletonTableComponent,
    StatusColorPipe,
    LocaleDatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './requests.component.html',
  styleUrl: './requests.component.scss',
})
export class RequestsComponent implements OnInit {
  private readonly enrollmentsService = inject(ParentEnrollmentsService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly requests = signal<ParentEnrollment[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.enrollmentsService.list().subscribe({
      next: (items) => {
        this.requests.set([...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  findSchool(): void {
    void this.router.navigate(['/parent/schools']);
  }
}
