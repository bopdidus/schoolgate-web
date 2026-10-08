import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { selectUser } from '../../core/store/auth.reducer';
import { homeRouteFor } from '../../core/auth/home-route';
import { LanguageService } from '../../core/services/language.service';
import { BrandLogoComponent } from '../../shared/components/brand-logo/brand-logo.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

/**
 * Top bar of the public site: brand, language and theme, and the way in.
 * Visitors are anonymous, so it only reads the store to offer "Dashboard"
 * instead when a session is already known.
 */
@Component({
  selector: 'app-home-header',
  standalone: true,
  imports: [AsyncPipe, RouterLink, MatButtonModule, MatTooltipModule, TranslateModule, BrandLogoComponent, ThemeToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-header.component.html',
  styleUrl: './home-header.component.scss',
})
export class HomeHeaderComponent {
  private readonly languageService = inject(LanguageService);

  readonly user$ = inject(Store).select(selectUser);
  readonly homeRouteFor = homeRouteFor;

  get currentLang(): string {
    return this.languageService.getCurrentLanguage().toUpperCase();
  }

  toggleLanguage(): void {
    this.languageService.toggleLanguage();
  }
}
