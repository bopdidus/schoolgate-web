import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { RefService } from './ref.service';
import { ReferenceService } from '../../api';

describe('RefService', () => {
  let api: jasmine.SpyObj<ReferenceService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<ReferenceService>('ReferenceService', [
      'referenceSpecialtiesGet',
      'referenceDocumentTypesGet',
      'referenceLevelsGet',
      'referenceCitiesGet',
    ]);
    api.referenceSpecialtiesGet.and.returnValue(of({ data: [{ id: 1, code: 'ELEC', label: 'Électronique' }] }) as never);
    api.referenceDocumentTypesGet.and.returnValue(of({ data: [{ id: 2, code: 'birth', label: 'Acte' }] }) as never);
    TestBed.configureTestingModule({ providers: [{ provide: ReferenceService, useValue: api }] });
  });

  it('loads the static catalogs once', () => {
    const ref = TestBed.inject(RefService);
    ref.getSpecialties().subscribe((s) => expect(s).toEqual([{ id: '1', code: 'ELEC', label: 'Électronique' }]));
    ref.getSpecialties().subscribe();
    ref.getDocumentTypes().subscribe((d) => expect(d[0].label).toBe('Acte'));
    expect(api.referenceSpecialtiesGet).toHaveBeenCalledTimes(1);
  });

  it('asks levels for a general type unless technical or vocational, and falls back on the request', () => {
    api.referenceLevelsGet.and.returnValue(of({ data: [{ id: 3, code: '6E', label: '6ème' }] }) as never);
    const ref = TestBed.inject(RefService);
    ref.getLevels('francophone', 'technical').subscribe((levels) =>
      expect(levels[0]).toEqual({ id: '3', code: '6E', label: '6ème', system: 'francophone', educationType: 'technical' }),
    );
    expect(api.referenceLevelsGet).toHaveBeenCalledWith('francophone', 'technical');
    ref.getLevels('anglophone', 'professional' as never).subscribe();
    expect(api.referenceLevelsGet).toHaveBeenCalledWith('anglophone', 'general');
  });

  it('searches cities, the whole list for an empty query', () => {
    api.referenceCitiesGet.and.returnValue(of({ data: [{ id: 9, name: 'Douala', admin_name: 'Littoral' }] }) as never);
    const ref = TestBed.inject(RefService);
    ref.searchCities('').subscribe((c) => expect(c[0]).toEqual(jasmine.objectContaining({ id: 9, name: 'Douala', adminName: 'Littoral' })));
    expect(api.referenceCitiesGet).toHaveBeenCalledWith(undefined);
    ref.searchCities('dou').subscribe();
    expect(api.referenceCitiesGet).toHaveBeenCalledWith('dou');
  });
});
