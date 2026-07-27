import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'localeDate', standalone: true })
export class LocaleDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, format: 'short' | 'long' = 'short'): string {
    if (!value) {
      return '—';
    }
    const date = typeof value === 'string' ? new Date(value) : value;
    const options: Intl.DateTimeFormatOptions =
      format === 'long'
        ? { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
        : { year: 'numeric', month: 'short', day: 'numeric' };
    return new Intl.DateTimeFormat('fr-CM', options).format(date);
  }
}
