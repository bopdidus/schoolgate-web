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
        <span class="empty-icon-circle">
          <mat-icon class="empty-icon">{{ icon }}</mat-icon>
        </span>
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
      padding: 40px 28px;
      transition: var(--transition-interactive);
    }

    mat-card-actions {
      justify-content: center;
      padding-bottom: 8px;
    }

    .empty-icon-circle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 88px;
      height: 88px;
      border-radius: 24px;
      background-color: var(--mat-sys-primary-container);
      margin-bottom: 20px;
      box-shadow: var(--shadow-card);
    }

    .empty-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--mat-sys-on-primary-container);
    }

    h3 {
      margin: 0 0 10px;
      font-size: 18px;
      font-weight: 650;
      line-height: 1.3;
      color: var(--color-text);
    }

    p {
      margin: 0 0 20px;
      color: var(--color-muted);
      max-width: 28rem;
      margin-inline: auto;
      line-height: 1.65;
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
