import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'xafCurrency', standalone: true })
export class XafCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) {
      return '—';
    }
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
}
