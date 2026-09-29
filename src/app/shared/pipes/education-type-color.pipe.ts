import { Pipe, PipeTransform } from '@angular/core';
import { EducationType } from '../models/common.model';

@Pipe({ name: 'educationTypeColor', standalone: true })
export class EducationTypeColorPipe implements PipeTransform {
  /**
   * Both spellings map to the same tone on purpose: the API returns
   * `vocational` while the filter dropdowns emit `professional`, and mapping
   * only one of them left the other falling through to the neutral default.
   */
  private readonly colorMap: Record<string, string> = {
    general: 'edu-type-general',
    technical: 'edu-type-technical',
    vocational: 'edu-type-professional',
    professional: 'edu-type-professional',
  };

  transform(type: EducationType | string): string {
    return `edu-type-chip ${this.colorMap[type] ?? 'edu-type-default'}`;
  }
}
