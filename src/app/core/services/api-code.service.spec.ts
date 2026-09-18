import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';

import { ApiCodeService } from './api-code.service';
import { ApiCodeDto } from '../../api';
import en from '../../../assets/i18n/en.json';
import fr from '../../../assets/i18n/fr.json';

describe('ApiCodeService', () => {
  let service: ApiCodeService;
  const translations: Record<string, string> = {
    'API_CODES.ENROLLMENT_WINDOW_CLOSED': 'The enrollment period is closed for this school',
    'COMMON.SERVER_ERROR': 'Server error',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ApiCodeService,
        {
          provide: TranslateService,
          useValue: {
            instant: (key: string) => translations[key] ?? key,
          },
        },
      ],
    });
    service = TestBed.inject(ApiCodeService);
  });

  it('translates a known code', () => {
    expect(service.translateCode('ENROLLMENT_WINDOW_CLOSED')).toBe(
      'The enrollment period is closed for this school',
    );
  });

  it('returns null for an unknown code so callers can fall back', () => {
    expect(service.translateCode('SOME_FUTURE_CODE')).toBeNull();
  });

  it('falls back on the server message, then on the generic text', () => {
    expect(service.resolve('SOME_FUTURE_CODE', 'server says no')).toBe('server says no');
    expect(service.resolve('SOME_FUTURE_CODE', null)).toBe('Server error');
    expect(service.resolve(null, undefined)).toBe('Server error');
  });

  it('extracts the code from an HTTP error envelope', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: {
        code: 'ENROLLMENT_WINDOW_CLOSED',
        error: { code: 'ENROLLMENT_WINDOW_CLOSED', message: 'closed' },
      },
    });
    expect(service.resolveHttpError(error)).toBe(
      'The enrollment period is closed for this school',
    );
  });

  it('returns null when the failed response carries no envelope', () => {
    const error = new HttpErrorResponse({ status: 0, error: new ProgressEvent('error') });
    expect(service.resolveHttpError(error)).toBeNull();
  });
});

/**
 * IEEE 1012 consistency check: every code of the OpenAPI enum must have a
 * translation in both catalogs. A missing entry fails CI (plan phase 7).
 */
describe('API code catalog completeness', () => {
  const codes = Object.values(ApiCodeDto) as string[];

  it('covers every ApiCode in English', () => {
    const catalog = (en as Record<string, unknown>)['API_CODES'] as Record<string, string>;
    for (const code of codes) {
      expect(catalog[code]).withContext(`missing en API_CODES.${code}`).toBeDefined();
    }
  });

  it('covers every ApiCode in French', () => {
    const catalog = (fr as Record<string, unknown>)['API_CODES'] as Record<string, string>;
    for (const code of codes) {
      expect(catalog[code]).withContext(`missing fr API_CODES.${code}`).toBeDefined();
    }
  });
});
