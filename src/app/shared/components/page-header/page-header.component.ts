import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [MatToolbarModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  @Input({ required: true }) title = '';
  /** Interpolation params for `title`, e.g. `{{ name }}` in `DASHBOARD.WELCOME`. */
  @Input() titleParams?: Record<string, unknown>;
  @Input() subtitle = '';
}
