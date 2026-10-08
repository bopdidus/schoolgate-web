import { Pipe, PipeTransform } from '@angular/core';
import { XafCurrencyPipe } from '../../shared/pipes/xaf-currency.pipe';
import { toFrancs } from '../domain/money';

/** Formats an amount in XAF cents (the parent space's unit) as francs. */
@Pipe({ name: 'cents', standalone: true })
export class CentsPipe implements PipeTransform {
  private readonly xaf = new XafCurrencyPipe();

  transform(cents: number | null | undefined): string {
    return this.xaf.transform(cents == null ? cents : toFrancs(cents));
  }
}
