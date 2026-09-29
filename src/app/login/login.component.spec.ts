import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';

import { LoginComponent } from './login.component';
import { provideTestDefaults } from '../../testing/test-providers';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;

  async function render(queryParams: Record<string, string> = {}): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        ...provideTestDefaults(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
  }

  it('should create', async () => {
    await render();
    expect(fixture.componentInstance).toBeTruthy();
  });

  // Set by the sign-up page, so a new school admin only types their password.
  it('pre-fills the email passed in the URL', async () => {
    await render({ email: 'awa@lycee-test.cm' });
    expect(fixture.componentInstance.form.controls.email.value).toBe('awa@lycee-test.cm');
  });

  it('links to the school sign-up and back to the home page', async () => {
    await render();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('a.register-link')?.getAttribute('href')).toBe('/register');
    expect(el.querySelector('a.home-link')?.getAttribute('href')).toBe('/');
  });
});
