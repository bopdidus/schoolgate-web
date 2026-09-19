import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';

import { HomeHeaderComponent } from './home-header.component';
import { AuthActions } from '../../core/store/auth.actions';
import { provideTestDefaults } from '../../../testing/test-providers';

describe('HomeHeaderComponent', () => {
  let fixture: ComponentFixture<HomeHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeHeaderComponent],
      providers: [...provideTestDefaults()],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeHeaderComponent);
    fixture.detectChanges();
  });

  const el = (): HTMLElement => fixture.nativeElement as HTMLElement;

  it('shows "sign in" and "register" to a visitor', () => {
    expect(el().querySelector('a.login-link')?.getAttribute('href')).toBe('/login');
    expect(el().querySelector('a.register-link')?.getAttribute('href')).toBe('/register');
    expect(el().querySelector('a.dashboard-link')).toBeNull();
  });

  it('offers the dashboard instead once a session is known', () => {
    TestBed.inject(Store).dispatch(
      AuthActions.initSuccess({
        user: { id: '1', email: 'a@b.cm', name: 'A', role: 'admin', isActive: true, createdAt: '' },
      }),
    );
    fixture.detectChanges();

    expect(el().querySelector('a.dashboard-link')?.getAttribute('href')).toBe('/dashboard');
    expect(el().querySelector('a.login-link')).toBeNull();
  });
});
