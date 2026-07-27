import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-skeleton-table',
  standalone: true,
  imports: [MatCardModule, MatProgressBarModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card appearance="outlined">
      <mat-progress-bar mode="indeterminate" />
      <mat-card-content>
        <div class="skeleton-rows">
          @for (row of rows; track row) {
            <div class="skeleton-row">
              @for (col of columns; track col) {
                <div class="skeleton-bar"></div>
              }
            </div>
          }
        </div>
      </mat-card-content>
    </mat-card>
  `,
})
export class SkeletonTableComponent {
  @Input() rows = [1, 2, 3, 4, 5];
  @Input() columns = [1, 2, 3, 4, 5];
}
