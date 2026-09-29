import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { RegisterComponent } from './register.component';
import { RegisterService, SchoolRegistrationResult } from './register.service';
import { provideTestDefaults } from '../../testing/test-providers';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let registerService: jasmine.SpyObj<RegisterService>;

  beforeEach(async () => {
    registerService = jasmine.createSpyObj('RegisterService', ['register']);
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [...provideTestDefaults(), { provide: RegisterService, useValue: registerService }],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();
  });

  const component = () => fixture.componentInstance;
  const el = (): HTMLElement => fixture.nativeElement as HTMLElement;

  function fillValidForm(): void {
    component().form.setValue({
      school: {
        name: 'Lycée de Test',
        cityId: 1,
        system: 'bilingual',
        address: '',
        phone: '',
        email: '',
      },
      admin: {
        firstName: 'Awa',
        lastName: 'Mbida',
        email: 'awa@lycee-test.cm',
        phone: '',
        password: 'Passw0rd!',
        confirmPassword: 'Passw0rd!',
      },
    });
  }

  function succeedWith(status: SchoolRegistrationResult['status']): void {
    registerService.register.and.returnValue(of({ schoolId: '9', status, adminEmail: 'awa@lycee-test.cm' }));
    fillValidForm();
    component().submit();
    fixture.detectChanges();
  }

  it('does not send an incomplete form', () => {
    component().submit();

    expect(registerService.register).not.toHaveBeenCalled();
    expect(component().form.controls.school.controls.name.touched).toBeTrue();
  });

  it('refuses a confirmation that differs from the password', () => {
    fillValidForm();
    component().form.controls.admin.controls.confirmPassword.setValue('Other-Passw0rd');
    component().submit();

    expect(registerService.register).not.toHaveBeenCalled();
  });

  it('sends the school and its administrator, without the confirmation', () => {
    succeedWith('active');

    const sent = registerService.register.calls.mostRecent().args[0];
    expect(sent.school.name).toBe('Lycée de Test');
    expect(sent.school.cityId).toBe(1);
    expect(sent.admin.email).toBe('awa@lycee-test.cm');
    expect('confirmPassword' in sent.admin).toBeFalse();
  });

  it('says the school is live when published at once, and leads to the login', () => {
    succeedWith('active');

    expect(el().textContent).toContain('REGISTER.DONE_ACTIVE_TITLE');
    expect(el().querySelector('a.go-login')?.getAttribute('href')).toBe('/login?email=awa@lycee-test.cm');
  });

  it('says the school waits for validation otherwise', () => {
    succeedWith('pending');

    expect(el().textContent).toContain('REGISTER.DONE_PENDING_TITLE');
  });

  it('points at the email field when it is already used', () => {
    registerService.register.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    fillValidForm();
    component().submit();

    expect(component().form.controls.admin.controls.email.hasError('taken')).toBeTrue();
    expect(component().result()).toBeNull();
  });
});
