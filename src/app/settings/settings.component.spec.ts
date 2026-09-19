import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsComponent } from './settings.component';
import { provideTestDefaults } from '../../testing/test-providers';

describe('SettingsComponent', () => {
  let fixture: ComponentFixture<SettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        ...provideTestDefaults(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows the mismatch error under the confirmation field', () => {
    const { newPassword, confirmPassword } = fixture.componentInstance.passwordForm.controls;
    newPassword.setValue('secret1');
    confirmPassword.setValue('secret2');
    confirmPassword.markAsTouched();
    fixture.detectChanges();

    expect(confirmPassword.hasError('mismatch')).toBeTrue();
    expect(fixture.nativeElement.querySelector('mat-error')?.textContent).toContain('SETTINGS.PASSWORD_MISMATCH');
  });

  it('re-checks the confirmation when the new password changes', () => {
    const { currentPassword, newPassword, confirmPassword } = fixture.componentInstance.passwordForm.controls;
    currentPassword.setValue('old-secret');
    newPassword.setValue('secret1');
    confirmPassword.setValue('secret12');
    expect(fixture.componentInstance.passwordForm.invalid).toBeTrue();

    newPassword.setValue('secret12');
    expect(fixture.componentInstance.passwordForm.valid).toBeTrue();
  });

  it('toggles each password field independently', () => {
    const input = (name: string): HTMLInputElement =>
      fixture.nativeElement.querySelector(`input[formControlName="${name}"]`);

    fixture.componentInstance.hideNewPassword.set(false);
    fixture.detectChanges();

    expect(input('newPassword').type).toBe('text');
    expect(input('currentPassword').type).toBe('password');
    expect(input('confirmPassword').type).toBe('password');
  });
});
