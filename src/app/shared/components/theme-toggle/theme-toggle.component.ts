import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeService, ThemeMode } from '../../../core/services/theme.service';

/**
 * Light / dark / follow-system picker. A menu rather than a two-state switch,
 * because "follow the system" is a real third choice and a back-office is read
 * all day in changing light.
 */
@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss',
})
export class ThemeToggleComponent {
  private readonly theme = inject(ThemeService);

  readonly current = this.theme.mode;

  readonly options: ReadonlyArray<{ mode: ThemeMode; icon: string; label: string }> = [
    { mode: 'light', icon: 'light_mode', label: 'SETTINGS.THEME_LIGHT' },
    { mode: 'dark', icon: 'dark_mode', label: 'SETTINGS.THEME_DARK' },
    { mode: 'system', icon: 'contrast', label: 'SETTINGS.THEME_SYSTEM' },
  ];

  readonly icon = computed(() => {
    const mode = this.current();
    if (mode === 'system') return 'contrast';
    return mode === 'dark' ? 'dark_mode' : 'light_mode';
  });

  select(mode: ThemeMode): void {
    this.theme.apply(mode);
  }
}
