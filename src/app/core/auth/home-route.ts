import { UserRole } from '../../shared/models/common.model';

/** Roles that work in the school back office (dashboard, enrollments, ...). */
export const STAFF_ROLES: UserRole[] = ['admin', 'school_admin', 'school_editor'];

/** Landing page of the parent space: finding a school, as on the mobile app. */
export const PARENT_HOME_ROUTE = '/parent/schools';
export const STAFF_HOME_ROUTE = '/dashboard';

/**
 * Where a signed-in user lands (after login, on the guest pages, or when a
 * route is not for their role): parents in their space, staff on the dashboard.
 */
export function homeRouteFor(role: UserRole | null | undefined): string {
  return role === 'parent' ? PARENT_HOME_ROUTE : STAFF_HOME_ROUTE;
}
