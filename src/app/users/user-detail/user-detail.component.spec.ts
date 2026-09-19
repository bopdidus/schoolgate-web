import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { UserDetailComponent } from './user-detail.component';
import { UserService } from '../user.service';
import { SchoolService } from '../../schools/school.service';
import { PasswordResetService } from '../../password-resets/password-reset.service';
import { User } from '../../core/models/auth.model';
import { provideTestDefaults } from '../../../testing/test-providers';

describe('UserDetailComponent', () => {
  let fixture: ComponentFixture<UserDetailComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let confirmed: boolean;

  const staff: User = {
    id: '8',
    email: 'admin@verif.com',
    name: 'My Verifadmin',
    role: 'school_admin',
    schoolId: '1',
    isActive: true,
    createdAt: '',
  };

  beforeEach(async () => {
    confirmed = true;
    userService = jasmine.createSpyObj('UserService', ['getById', 'resetPassword']);
    userService.getById.and.returnValue(of(staff));
    userService.resetPassword.and.returnValue(of(1));

    await TestBed.configureTestingModule({
      imports: [UserDetailComponent],
      providers: [
        ...provideTestDefaults(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '8' }) } } },
        { provide: UserService, useValue: userService },
        { provide: SchoolService, useValue: { getById: () => of({ name: 'Lycée Verif' }) } },
        {
          provide: PasswordResetService,
          useValue: {
            getStatsForUser: () => of({ total: 3, pending: 1, lastRequestedAt: '2026-09-19T04:54:58Z' }),
          },
        },
        {
          provide: MatDialog,
          useValue: { open: () => ({ afterClosed: () => of({ confirmed }) }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserDetailComponent);
    fixture.detectChanges();
  });

  const el = (): HTMLElement => fixture.nativeElement as HTMLElement;

  it('shows the user, their school and how many reset requests they made', () => {
    expect(userService.getById).toHaveBeenCalledWith('8');
    expect(el().textContent).toContain('admin@verif.com');
    expect(el().textContent).toContain('Lycée Verif');
    expect(el().querySelector('.reset-total')?.textContent?.trim()).toBe('3');
    expect(el().querySelector('.reset-pending')?.textContent?.trim()).toBe('1');
  });

  it('generates a strong password and shows it', () => {
    fixture.componentInstance.generate();
    fixture.detectChanges();

    const input: HTMLInputElement = el().querySelector('input[formControlName="password"]')!;
    expect(input.type).toBe('text');
    expect(input.value.length).toBeGreaterThanOrEqual(8);
    expect(fixture.componentInstance.passwordForm.valid).toBeTrue();
  });

  it('resets the password once the admin confirms', () => {
    fixture.componentInstance.passwordForm.controls.password.setValue('N3w-Passw0rd!');
    fixture.componentInstance.resetPassword();

    expect(userService.resetPassword).toHaveBeenCalledWith('8', 'N3w-Passw0rd!');
  });

  it('does nothing when the admin cancels the confirmation', () => {
    confirmed = false;
    fixture.componentInstance.passwordForm.controls.password.setValue('N3w-Passw0rd!');
    fixture.componentInstance.resetPassword();

    expect(userService.resetPassword).not.toHaveBeenCalled();
  });

  it('refuses a password shorter than 8 characters', () => {
    fixture.componentInstance.passwordForm.controls.password.setValue('short');
    fixture.componentInstance.resetPassword();

    expect(userService.resetPassword).not.toHaveBeenCalled();
  });
});
