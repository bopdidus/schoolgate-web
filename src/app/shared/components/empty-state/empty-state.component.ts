import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatCardModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card appearance="outlined" class="empty-state-card">
      <mat-card-content>
        <mat-icon class="empty-icon">{{ icon }}</mat-icon>
        <h3>{{ title | translate }}</h3>
        @if (description) {
          <p>{{ description | translate }}</p>
        }
      </mat-card-content>
      @if (actionLabel) {
        <mat-card-actions>
          <button mat-flat-button color="primary" (click)="actionClick.emit()">
            {{ actionLabel | translate }}
          </button>
        </mat-card-actions>
      }
    </mat-card>
  `,
  styles: `
    .empty-state-card {
      text-align: center;
      padding: 24px 16px;
    }
    .empty-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--color-primary);
      margin-bottom: 16px;
    }
    h3 {
      margin: 0 0 8px;
      font-size: 20px;
      font-weight: 600;
    }
    p {
      margin: 0 0 16px;
      color: var(--color-muted);
      max-width: 28rem;
      margin-inline: auto;
    }
  `,
})
export class EmptyStateComponent {
  @Input({ required: true }) icon = 'inbox';
  @Input({ required: true }) title = 'COMMON.NO_DATA';
  @Input() description = '';
  @Input() actionLabel = '';
  @Output() actionClick = new EventEmitter<void>();
}
