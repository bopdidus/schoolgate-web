import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';

import { UserCreateDialogComponent } from './user-create-dialog.component';
import { provideTestDefaults } from '../../../testing/test-providers';

describe('UserCreateDialogComponent', () => {
  let fixture: ComponentFixture<UserCreateDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCreateDialogComponent],
      providers: [
        ...provideTestDefaults(),
        { provide: MatDialogRef, useValue: jasmine.createSpyObj('MatDialogRef', ['close']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserCreateDialogComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('flags a confirmation that differs from the password', () => {
    const { password, confirmPassword } = fixture.componentInstance.form.controls;
    password.setValue('secret1');
    confirmPassword.setValue('secret2');
    expect(confirmPassword.hasError('mismatch')).toBeTrue();
  });

  it('re-checks the confirmation when the password changes', () => {
    const { password, confirmPassword } = fixture.componentInstance.form.controls;
    password.setValue('secret1');
    confirmPassword.setValue('secret12');
    expect(confirmPassword.valid).toBeFalse();

    password.setValue('secret12');
    expect(confirmPassword.valid).toBeTrue();
  });

  it('toggles password visibility', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[formControlName="password"]');
    expect(input.type).toBe('password');

    fixture.componentInstance.hidePassword.set(false);
    fixture.detectChanges();
    expect(input.type).toBe('text');
  });
});
