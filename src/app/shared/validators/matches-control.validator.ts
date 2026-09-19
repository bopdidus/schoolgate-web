import { ValidatorFn } from '@angular/forms';

/**
 * Fails with `{ mismatch: true }` when the value differs from the sibling
 * control `otherControlName` (e.g. a password confirmation).
 *
 * It sits on the confirmation control itself — not on the form group — so
 * mat-form-field shows its `<mat-error>` under that field. Re-run it when the
 * other control changes (`updateValueAndValidity()`), since Angular only
 * re-validates a control when its own value changes.
 */
export function matchesControl(otherControlName: string): ValidatorFn {
  return (control) => {
    const other = control.parent?.get(otherControlName)?.value;
    return control.value && control.value !== other ? { mismatch: true } : null;
  };
}
