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
      <ng-content select="[actions]"></ng-content>
    </mat-toolbar>
  `,
  styles: `
    .page-header-toolbar {
      background: transparent;
      padding: 0 0 24px;
      height: auto;
      min-height: unset;
    }
    .page-header-text h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      line-height: 1.3;
    }
    .page-header-text p {
      margin: 4px 0 0;
      font-size: 14px;
      color: var(--color-muted);
    }
  `,
})
export class PageHeaderComponent {
  @Input({ required: true }) title = '';
  @Input() subtitle = '';
}
