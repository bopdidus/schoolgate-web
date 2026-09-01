import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [MatToolbarModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-toolbar class="page-header-toolbar">
      <div class="page-header-text">
        <h1>{{ title | translate }}</h1>
        @if (subtitle) {
          <p>{{ subtitle | translate }}</p>
        }
      </div>
      <span class="toolbar-spacer"></span>
      <div class="page-header-actions">
        <ng-content select="[actions]"></ng-content>
      </div>
    </mat-toolbar>
  `,
  styles: `
    .page-header-toolbar {
      background: transparent;
      padding: 0 0 var(--spacing-section);
      height: auto;
      min-height: unset;
      gap: 16px;
    }

    .page-header-text h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 700;
      line-height: 1.3;
      letter-spacing: -0.025em;
      color: var(--color-text);
    }

    .page-header-text p {
      margin: 6px 0 0;
      font-size: 14px;
      line-height: 1.6;
      color: var(--color-muted);
      max-width: 42rem;
    }

    .page-header-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
    }
  `,
})
export class PageHeaderComponent {
  @Input({ required: true }) title = '';
  @Input() subtitle = '';
}
