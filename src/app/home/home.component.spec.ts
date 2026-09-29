import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeComponent } from './home.component';
import { provideTestDefaults } from '../../testing/test-providers';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [...provideTestDefaults()],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
  });

  const el = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const hrefs = (selector: string): (string | null)[] =>
    Array.from(el().querySelectorAll(selector)).map((a) => a.getAttribute('href'));

  it('offers a way to sign in and a way to register a school', () => {
    expect(hrefs('a.login-link')).toContain('/login');
    expect(hrefs('a.register-link')).toContain('/register');
  });

  it('explains how it works in four steps', () => {
    expect(el().querySelectorAll('.home-how__step').length).toBe(4);
  });

  it('credits Senior Digital Soft', () => {
    expect(el().querySelector('.home-footer')?.textContent).toContain('Senior Digital Soft');
    expect(el().querySelector('app-home-header')?.textContent).toContain('Senior Digital Soft');
  });
});
