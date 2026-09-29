import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../../core/services/language.service';

/**
 * Formats a date in the language the user actually chose.
 *
 * The locale used to be hardcoded to `fr-CM`, so dates stayed French even with
 * the interface in English. `pure: false` is required because the language can
 * change without the bound value changing.
 */
@Pipe({ name: 'localeDate', standalone: true, pure: false })
export class LocaleDatePipe implements PipeTransform {
  private readonly language = inject(LanguageService);

  transform(value: string | Date | null | undefined, format: 'short' | 'long' = 'short'): string {
    if (!value) {
      return '—';
    }
    const date = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    const options: Intl.DateTimeFormatOptions =
      format === 'long'
        ? { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
        : { year: 'numeric', month: 'short', day: 'numeric' };
    // Cameroon regional formatting, in the chosen language.
    const locale = this.language.getCurrentLanguage() === 'fr' ? 'fr-CM' : 'en-CM';
    return new Intl.DateTimeFormat(locale, options).format(date);
  }
}
