import { subject } from '@casl/ability';
import { User } from '../models/auth.model';
import { AppAbility, defineAbilityFor } from './app-ability';

function userWith(role: User['role'], schoolId?: string): User {
  return {
    id: 'u1',
    email: 'u@example.com',
    name: 'U',
    role,
    schoolId,
    isActive: true,
    createdAt: '',
  };
}

function canOn(ability: AppAbility, action: Parameters<AppAbility['can']>[0], type: string, schoolId: string) {
  return ability.can(action, subject(type, { schoolId }) as never);
}

describe('defineAbilityFor', () => {
  it('grants an admin everything, on any school', () => {
    const ability = defineAbilityFor(userWith('admin'));

    expect(canOn(ability, 'update', 'School', '1')).toBe(true);
    expect(canOn(ability, 'manage', 'SchoolClass', '42')).toBe(true);
    expect(canOn(ability, 'decide', 'Enrollment', '99')).toBe(true);
  });

  it('confines a school_admin to their own school', () => {
    const ability = defineAbilityFor(userWith('school_admin', '2'));

    expect(canOn(ability, 'manage', 'SchoolClass', '2')).toBe(true);
    expect(canOn(ability, 'update', 'School', '2')).toBe(true);
    expect(canOn(ability, 'manage', 'DocumentRequirement', '2')).toBe(true);

    // The whole point: another school's id must be refused.
    expect(canOn(ability, 'manage', 'SchoolClass', '1')).toBe(false);
    expect(canOn(ability, 'update', 'School', '1')).toBe(false);
  });

  it('lets a school_editor decide enrollments but never manage the school', () => {
    const ability = defineAbilityFor(userWith('school_editor', '2'));

    expect(canOn(ability, 'decide', 'Enrollment', '2')).toBe(true);
    expect(canOn(ability, 'read', 'School', '2')).toBe(true);

    // Mirrors the backend's CanManageSchool, which excludes school_editor.
    expect(canOn(ability, 'manage', 'SchoolClass', '2')).toBe(false);
    expect(canOn(ability, 'update', 'School', '2')).toBe(false);
    expect(canOn(ability, 'decide', 'Enrollment', '1')).toBe(false);
  });

  it('grants nothing to staff with no school attached', () => {
    const ability = defineAbilityFor(userWith('school_admin', undefined));

    expect(canOn(ability, 'manage', 'SchoolClass', '2')).toBe(false);
    expect(canOn(ability, 'read', 'School', '2')).toBe(false);
  });

  it('grants nothing when signed out', () => {
    const ability = defineAbilityFor(null);

    expect(canOn(ability, 'read', 'School', '1')).toBe(false);
  });

  it('refuses school creation to anyone but an admin', () => {
    expect(defineAbilityFor(userWith('admin')).can('create', 'School')).toBe(true);
    expect(defineAbilityFor(userWith('school_admin', '2')).can('create', 'School')).toBe(false);
  });
});
