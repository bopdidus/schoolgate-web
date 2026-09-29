import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Shown when a request fails.
 *
 * Previously every subscription swallowed its error and left a blank page, so a
 * failed load was indistinguishable from "no data". This states what went wrong
 * and offers the one thing the user can actually do about it — try again.
 */
@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './error-state.component.html',
  styleUrl: './error-state.component.scss',
})
export class ErrorStateComponent {
  readonly icon = input('error_outline');
  readonly title = input('COMMON.ERROR_TITLE');
  readonly description = input('COMMON.ERROR_DESCRIPTION');
  readonly retryable = input(true);

  readonly retry = output<void>();
}
