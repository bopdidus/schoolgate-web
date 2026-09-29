import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

export type StatTone = 'primary' | 'success' | 'warning' | 'danger' | 'accent';

/**
 * A single KPI.
 *
 * The previous dashboard rendered these as a bare label over a large number,
 * which gave the reader no way to tell an alarming figure from a healthy one at
 * a glance. Here the icon and the tone carry the state, and an optional delta
 * gives the number a reference point.
 */
@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [NgTemplateOutlet, RouterLink, MatCardModule, MatIconModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss',
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly icon = input<string | null>(null);
  readonly tone = input<StatTone>('primary');
  /** Optional translation key shown beside the delta, e.g. "vs last month". */
  readonly hint = input<string | null>(null);
  /** Percentage change. Positive reads as up, negative as down. */
  readonly delta = input<number | null>(null);
  /** Router link: when set, the whole card navigates there (e.g. to the list behind the figure). */
  readonly link = input<string | null>(null);
  /** Query parameters for `link`, e.g. `{ status: 'pending' }`. */
  readonly linkQueryParams = input<Record<string, string> | null>(null);

  readonly deltaDirection = computed(() => ((this.delta() ?? 0) >= 0 ? 'up' : 'down'));
  readonly deltaIcon = computed(() => (this.deltaDirection() === 'up' ? 'trending_up' : 'trending_down'));
  readonly deltaLabel = computed(() => {
    const value = this.delta();
    if (value === null) return '';
    return `${value > 0 ? '+' : ''}${value}%`;
  });
}
