import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Replaces the silent `redirectTo: 'dashboard'` that used to swallow every bad
 * URL. A mistyped or stale link now says so, instead of pretending the user
 * asked for the dashboard.
 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss',
})
export class NotFoundComponent {
  private readonly location = inject(Location);

  goBack(): void {
    this.location.back();
  }
}
