import { TestBed } from '@angular/core/testing';

import { EducationTypeColorPipe } from './education-type-color.pipe';
import { LocaleDatePipe } from './locale-date.pipe';
import { StatusColorPipe } from './status-color.pipe';
import { XafCurrencyPipe } from './xaf-currency.pipe';
import { LanguageService } from '../../core/services/language.service';
import { CentsPipe } from '../../parent/shared/cents.pipe';

describe('shared pipes', () => {
  it('formats francs, a dash for nothing', () => {
    const xaf = new XafCurrencyPipe();
    expect(xaf.transform(null)).toBe('—');
    expect(xaf.transform(50000).replace(/\s/g, ' ')).toContain('50 000');
    expect(xaf.transform(50000)).toContain('FCFA');
  });

  it('formats cents as francs in the parent space', () => {
    expect(new CentsPipe().transform(5_000_000)).toBe(new XafCurrencyPipe().transform(50000));
    expect(new CentsPipe().transform(undefined)).toBe('—');
  });

  it('colors every known status, a neutral tone otherwise', () => {
    const pipe = new StatusColorPipe();
    expect(pipe.transform('validated')).toBe('status-chip status-validated');
    expect(pipe.transform('refund_pending')).toBe('status-chip status-refund_pending');
    expect(pipe.transform('mystery')).toBe('status-chip status-default');
  });

  it('gives vocational and professional the same tone', () => {
    const pipe = new EducationTypeColorPipe();
    expect(pipe.transform('vocational')).toBe(pipe.transform('professional'));
    expect(pipe.transform('x')).toContain('edu-type-default');
  });

  it('formats dates in the chosen language', () => {
    let lang = 'fr';
    TestBed.configureTestingModule({ providers: [{ provide: LanguageService, useValue: { getCurrentLanguage: () => lang } }] });
    const pipe = TestBed.runInInjectionContext(() => new LocaleDatePipe());
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform('not a date')).toBe('—');
    expect(pipe.transform('2026-10-17T12:00:00Z', 'long')).toContain('octobre');
    lang = 'en';
    expect(pipe.transform('2026-10-17T12:00:00Z', 'long')).toContain('October');
  });
});
