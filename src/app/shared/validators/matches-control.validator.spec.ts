import { FormControl, FormGroup } from '@angular/forms';

import { matchesControl } from './matches-control.validator';

describe('matchesControl', () => {
  // Values are set once the group exists, as when a user types: the validator
  // reads the sibling through `control.parent`.
  function form(password: string, confirm: string) {
    const group = new FormGroup({
      password: new FormControl(''),
      confirm: new FormControl('', matchesControl('password')),
    });
    group.setValue({ password, confirm });
    return group;
  }

  it('passes when both values are equal', () => {
    expect(form('secret1', 'secret1').controls.confirm.valid).toBeTrue();
  });

  it('fails with mismatch when values differ', () => {
    expect(form('secret1', 'secret2').controls.confirm.hasError('mismatch')).toBeTrue();
  });

  // An empty confirmation is the `required` validator's job, not this one.
  it('ignores an empty confirmation', () => {
    expect(form('secret1', '').controls.confirm.valid).toBeTrue();
  });
});
