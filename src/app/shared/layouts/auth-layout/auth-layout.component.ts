import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../../core/i18n/language.service';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, MatButtonModule, MatTooltipModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-layout">
      <div class="auth-atmosphere" aria-hidden="true"></div>
      <div class="auth-shell">
        <router-outlet />
      </div>

      <button
        mat-fab
        type="button"
        class="lang-fab"
        (click)="toggleLanguage()"
        [attr.aria-label]="'SETTINGS.LANGUAGE' | translate"
        [matTooltip]="'SETTINGS.LANGUAGE' | translate"
      >
        {{ currentLang }}
      </button>
    </div>
  `,
  styles: `
    .auth-layout {
      box-sizing: border-box;
      position: relative;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background-color: var(--color-background);
      overflow: hidden;
    }

    .auth-atmosphere {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        radial-gradient(ellipse 80% 50% at 10% -10%, rgba(79, 70, 229, 0.12), transparent 55%),
        radial-gradient(ellipse 70% 45% at 90% 110%, rgba(124, 58, 237, 0.1), transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.55), transparent 70%);
    }

    .auth-shell {
      position: relative;
      z-index: 1;
      width: 100%;
      display: flex;
      justify-content: center;
    }

    .lang-fab {
      position: fixed;
      right: 24px;
      bottom: 24px;
      z-index: 10;
      transition: var(--transition-interactive);
      box-shadow: var(--shadow-card-hover) !important;
    }

    .lang-fab:hover {
      transform: translateY(-2px);
    }
  `,
})
export class AuthLayoutComponent {
  private readonly languageService = inject(LanguageService);

  get currentLang(): string {
    return this.languageService.getCurrentLanguage().toUpperCase();
  }

  toggleLanguage(): void {
    this.languageService.toggleLanguage();
  }
}
