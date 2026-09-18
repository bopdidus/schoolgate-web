import { AbilityBuilder, createMongoAbility, ForcedSubject, MongoAbility } from '@casl/ability';
import { User } from '../models/auth.model';

/**
 * What a user may do. `manage` is CASL's wildcard (any action); `decide` is the
 * accept/reject verdict on an enrollment, which school_editor holds even though
 * it cannot manage the school itself.
 */
export type AppAction = 'manage' | 'read' | 'create' | 'update' | 'delete' | 'decide';

/** Subject names, i.e. what an action is performed on. */
export type AppSubjectName =
  | 'School'
  | 'SchoolClass'
  | 'DocumentRequirement'
  | 'Enrollment'
  | 'Payment'
  | 'User';

/**
 * Every scoped subject carries the school it belongs to under the same
 * `schoolId` key — including `School` itself, which reports its own id there.
 * One condition key keeps the rules readable and the guards trivial.
 */
export interface SchoolScoped {
  schoolId?: string;
}

/**
 * A subject usable either by name or as a tagged object. `ForcedSubject` is how
 * CASL learns the shape behind each name, so `can('manage', 'SchoolClass', {
 * schoolId })` type-checks its conditions instead of collapsing to `never` —
 * hence the per-name tagging rather than one union-wide tag.
 */
type Scoped<N extends AppSubjectName> = N | (SchoolScoped & ForcedSubject<N>);

export type AppAbilities =
  | [AppAction, 'all']
  | [AppAction, Scoped<'School'>]
  | [AppAction, Scoped<'SchoolClass'>]
  | [AppAction, Scoped<'DocumentRequirement'>]
  | [AppAction, Scoped<'Enrollment'>]
  | [AppAction, Scoped<'Payment'>]
  | [AppAction, Scoped<'User'>];

export type AppAbility = MongoAbility<AppAbilities>;

/**
 * Mirrors the backend's authorization predicates in
 * `internal/domain/user/user.go` — `CanManageSchool`, `CanDecideEnrollment`,
 * `CanAccessSchool`. This is a UX/consistency layer only: the server re-checks
 * every mutation, so a stale or tampered ability here grants nothing.
 */
export function defineAbilityFor(user: User | null): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  if (!user) {
    return build();
  }

  if (user.role === 'admin') {
    can('manage', 'all');
    return build();
  }

  const schoolId = user.schoolId;
  // School staff without a school attached can do nothing scoped: the backend
  // treats a null SchoolID as "belongs to no school" (belongsToSchool).
  if (!schoolId) {
    return build();
  }

  if (user.role === 'school_admin') {
    // CanManageSchool: school_admin, own school only.
    can(['read', 'update', 'delete'], 'School', { schoolId });
    can('manage', 'SchoolClass', { schoolId });
    can('manage', 'DocumentRequirement', { schoolId });
  }

  if (user.role === 'school_admin' || user.role === 'school_editor') {
    // CanAccessSchool / CanDecideEnrollment: both staff roles, own school only.
    can('read', 'School', { schoolId });
    can(['read', 'decide'], 'Enrollment', { schoolId });
    can('read', 'Payment', { schoolId });
  }

  return build();
}
