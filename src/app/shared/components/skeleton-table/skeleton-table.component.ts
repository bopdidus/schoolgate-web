import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-skeleton-table',
  standalone: true,
  imports: [MatCardModule, MatProgressBarModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './skeleton-table.component.html',
  styleUrl: './skeleton-table.component.scss',
})
export class SkeletonTableComponent {
  @Input() rows = [1, 2, 3, 4, 5];
  @Input() columns = [1, 2, 3, 4, 5];
}
