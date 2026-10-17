import { Pipe, PipeTransform } from '@angular/core';

const XAF = new Intl.NumberFormat('fr-CM', {
  style: 'currency',
  currency: 'XAF',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Francs as the app shows money everywhere (12 500 FCFA); '—' when unknown. */
export function formatXaf(value: number | null | undefined): string {
  return value == null ? '—' : XAF.format(value);
}

@Pipe({ name: 'xafCurrency', standalone: true })
export class XafCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatXaf(value);
  }
}
