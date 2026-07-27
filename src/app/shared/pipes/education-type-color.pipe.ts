import { Pipe, PipeTransform } from '@angular/core';
import { EducationType } from '../models/common.model';

@Pipe({ name: 'educationTypeColor', standalone: true })
export class EducationTypeColorPipe implements PipeTransform {
  private readonly colorMap: Record<string, string> = {
    general: 'edu-type-general',
    technical: 'edu-type-technical',
    vocational: 'edu-type-professional',
  };

  transform(type: EducationType | string): string {
    return `edu-type-chip ${this.colorMap[type] ?? 'edu-type-default'}`;
  }
}
