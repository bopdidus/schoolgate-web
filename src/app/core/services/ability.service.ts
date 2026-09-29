import { inject, Injectable, Signal, signal } from '@angular/core';
import { subject } from '@casl/ability';
import { Store } from '@ngrx/store';
import { selectUser } from '../store/auth.reducer';
import { AppAbility, AppAction, AppSubjectName, defineAbilityFor, SchoolScoped } from '../auth/app-ability';

/**
 * Holds the ability derived from the signed-in user and exposes the checks the
 * templates and guards use. Rebuilt on every auth change so a role or school
 * switch takes effect without a reload.
 */
@Injectable({ providedIn: 'root' })
export class AbilityService {
  private readonly store = inject(Store);
  private readonly current = signal<AppAbility>(defineAbilityFor(null));

  readonly ability: Signal<AppAbility> = this.current.asReadonly();

  constructor() {
    this.store.select(selectUser).subscribe((user) => {
      this.current.set(defineAbilityFor(user));
    });
  }

  /**
   * Checks an action against a school-scoped subject. Pass the owning school id
   * so ownership is part of the answer — `can('update', 'School')` without one
   * only passes for an admin, who holds the unconditional rule.
   */
  can<N extends AppSubjectName>(action: AppAction, subjectType: N, scope?: SchoolScoped): boolean {
    if (!scope) {
      return this.current().can(action, subjectType);
    }
    // CASL types subjects as a union of per-name tuples, and TypeScript cannot
    // prove a generic `N` matches exactly one branch. Narrowing happens once
    // here instead of at every call site; the rules themselves (app-ability.ts)
    // stay fully typed, and runtime behaviour is unchanged.
    const tagged = subject(subjectType, { ...scope }) as Parameters<AppAbility['can']>[1];
    return this.current().can(action, tagged);
  }

  cannot<N extends AppSubjectName>(action: AppAction, subjectType: N, scope?: SchoolScoped): boolean {
    return !this.can(action, subjectType, scope);
  }
}
