import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ReferenceService, SchoolsService } from '../../api';
import { pageToOffset, unwrapData } from '../../core/utils/openapi-helpers';
import { DocumentRequirement, LabelRef, MobileMoneyMethod, ParentSchool } from '../domain/models';
import { mapRequirement, mapSchool } from './parent-mappers';

export interface SchoolSearch {
  q?: string;
  cityId?: number;
  levelCode?: string;
  system?: 'francophone' | 'anglophone';
  page?: number;
  pageSize?: number;
}

export interface SchoolPage {
  items: ParentSchool[];
  total: number;
}

/** Finding schools and what they require, as on the mobile home screen. */
@Injectable({ providedIn: 'root' })
export class ParentSchoolsService {
  private readonly schoolsApi = inject(SchoolsService);
  private readonly referenceApi = inject(ReferenceService);

  search(s: SchoolSearch): Observable<SchoolPage> {
    const { limit, offset } = pageToOffset(s.page ?? 1, s.pageSize ?? 12);
    return this.schoolsApi
      .schoolsGet(s.q?.trim() || undefined, undefined, s.cityId, s.levelCode || undefined, s.system, limit, offset)
      .pipe(
        map((envelope) => ({
          items: (unwrapData(envelope) ?? []).map(mapSchool),
          total: envelope.meta?.total ?? 0,
        })),
      );
  }

  getById(id: string): Observable<ParentSchool> {
    return this.schoolsApi.schoolsIdGet(+id).pipe(map((envelope) => mapSchool(unwrapData(envelope))));
  }

  /** Class levels for the level filter (`/reference/levels`). */
  levels(): Observable<LabelRef[]> {
    return this.referenceApi.referenceLevelsGet(undefined, undefined, 200, 0).pipe(
      map((envelope) => {
        const byCode = new Map<string, LabelRef>();
        for (const l of unwrapData(envelope) ?? []) {
          const code = l.code ?? '';
          // Same level across systems/types: keep one entry per code.
          if (code && code !== 'other' && !byCode.has(code)) {
            byCode.set(code, { id: String(l.id ?? ''), code, label: l.label ?? code });
          }
        }
        return [...byCode.values()];
      }),
    );
  }

  documentRequirements(schoolId: string): Observable<DocumentRequirement[]> {
    return this.schoolsApi
      .schoolsIdDocumentRequirementsGet(+schoolId)
      .pipe(map((envelope) => (unwrapData(envelope) ?? []).map(mapRequirement)));
  }

  /** Mobile Money channels the school accepts (and can actually charge). */
  paymentMethods(schoolId: string): Observable<MobileMoneyMethod[]> {
    return this.schoolsApi
      .schoolsIdPaymentMethodsGet(+schoolId)
      .pipe(map((envelope) => (unwrapData(envelope)?.methods ?? []) as MobileMoneyMethod[]));
  }
}
