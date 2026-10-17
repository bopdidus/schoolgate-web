import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, UrlTree, convertToParamMap, provideRouter } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { abilityGuard } from './ability.guard';
import { unsavedChangesGuard } from './unsaved-changes.guard';
import { AbilityService } from '../services/ability.service';

describe('route guards', () => {
  let can: jasmine.Spy;

  beforeEach(() => {
    can = jasmine.createSpy('can');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AbilityService, useValue: { can } },
        { provide: TranslateService, useValue: { instant: (k: string) => `T:${k}` } },
      ],
    });
  });

  const route = (params: Record<string, string>) => ({ paramMap: convertToParamMap(params) }) as ActivatedRouteSnapshot;

  it('checks the ability on the school of the route, else sends home', () => {
    const guard = abilityGuard('update', 'School');
    can.and.returnValue(true);
    expect(TestBed.runInInjectionContext(() => guard(route({ id: '3' }), {} as never))).toBeTrue();
    expect(can).toHaveBeenCalledWith('update', 'School', { schoolId: '3' });

    can.and.returnValue(false);
    const denied = TestBed.runInInjectionContext(() => guard(route({}), {} as never)) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(denied)).toBe('/dashboard');
    expect(can).toHaveBeenCalledWith('update', 'School', undefined);
  });

  it('asks before leaving unsaved edits, in the user language', () => {
    const confirm = spyOn(window, 'confirm').and.returnValue(false);
    const leave = (dirty: boolean) =>
      TestBed.runInInjectionContext(() => unsavedChangesGuard({ hasUnsavedChanges: () => dirty }, {} as never, {} as never, {} as never));
    expect(leave(false)).toBeTrue();
    expect(confirm).not.toHaveBeenCalled();
    expect(leave(true)).toBeFalse();
    expect(confirm).toHaveBeenCalledWith('T:COMMON.UNSAVED_CHANGES');
  });
});
