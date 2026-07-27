import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'fillRate', standalone: true })
export class FillRatePipe implements PipeTransform {
  transform(enrolled: number | undefined, total: number | undefined): string {
    if (!total || total === 0) {
      return '0%';
    }
    const rate = Math.round(((enrolled ?? 0) / total) * 100);
    return `${rate}%`;
  }
}
