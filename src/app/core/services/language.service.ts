import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

const LANG_KEY = 'sg_language';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);

  init(): void {
    this.translate.addLangs(['en', 'fr']);
    this.translate.setDefaultLang('en');
    const saved = localStorage.getItem(LANG_KEY) ?? 'en';
    this.translate.use(saved);
  }

  setLanguage(lang: 'en' | 'fr'): void {
    this.translate.use(lang);
    localStorage.setItem(LANG_KEY, lang);
  }

  getCurrentLanguage(): string {
    return this.translate.currentLang || 'en';
  }

  toggleLanguage(): void {
    const next = this.getCurrentLanguage() === 'en' ? 'fr' : 'en';
    this.setLanguage(next as 'en' | 'fr');
  }
}
