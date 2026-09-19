import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AbilityService } from '../services/ability.service';
import { AppAction, AppSubjectName } from '../auth/app-ability';

const HOME_ROUTE = '/dashboard';

export interface AbilityGuardOptions {
  /**
   * Route param holding the owning school id (default `id`). The check then
   * answers "may this user do X *on that school*", not just "has the role".
   */
  schoolIdParam?: string;
}

/**
 * Route guard backed by CASL. Unlike a role-only guard, it refuses a
 * school_admin who aims at a school that is not theirs — closing the gap where
 * staff could open another school's form and only hit the server's 403 on save.
 *
 * Denied navigation goes to the dashboard rather than the login page: the user
 * is legitimately signed in, they simply have no business on that route.
 */
export const abilityGuard = (
  action: AppAction,
  subjectType: AppSubjectName,
  options: AbilityGuardOptions = {},
): CanActivateFn => {
  return (route: ActivatedRouteSnapshot) => {
    const abilities = inject(AbilityService);
    const router = inject(Router);

    const schoolId = route.paramMap.get(options.schoolIdParam ?? 'id') ?? undefined;
    const allowed = abilities.can(action, subjectType, schoolId ? { schoolId } : undefined);

    return allowed ? true : router.createUrlTree([HOME_ROUTE]);
  };
};
