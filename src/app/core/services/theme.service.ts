import { Injectable, signal, computed } from '@angular/core';

/**
 * The three states a viewer can be in. `system` is the default and deliberately
 * stamps no attribute, so the `color-scheme: light dark` declared on `html`
 * lets the operating system decide.
 */
export type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'sg_theme';
const MODES: readonly ThemeMode[] = ['system', 'light', 'dark'];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _mode = signal<ThemeMode>('system');

  /** The stored preference, which may be `system`. */
  readonly mode = this._mode.asReadonly();

  /** The theme actually being rendered, with `system` resolved against the OS. */
  readonly resolved = computed<'light' | 'dark'>(() => {
    const mode = this._mode();
    return mode === 'system' ? this.systemPrefersDark() : mode;
  });

  /**
   * Reads the persisted preference and applies it. Called once at startup.
   * Storage can throw outright in a locked-down browser, so every access is
   * guarded and simply falls back to following the system.
   */
  init(): void {
    this.apply(this.read());
  }

  apply(mode: ThemeMode): void {
    this._mode.set(mode);
    this.write(mode);

    const root = document.documentElement;
    if (mode === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', mode);
    }
  }

  /** Cycles system → light → dark → system, for a single-button control. */
  cycle(): void {
    const next = MODES[(MODES.indexOf(this._mode()) + 1) % MODES.length];
    this.apply(next);
  }

  private systemPrefersDark(): 'light' | 'dark' {
    return typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  private read(): ThemeMode {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return MODES.includes(stored as ThemeMode) ? (stored as ThemeMode) : 'system';
    } catch {
      return 'system';
    }
  }

  private write(mode: ThemeMode): void {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // A viewer who blocks site data simply loses the preference between
      // visits; the app must still render correctly, so this is not an error.
    }
  }
}
