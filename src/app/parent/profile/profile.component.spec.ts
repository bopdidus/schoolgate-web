import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';

import { ProfileComponent } from './profile.component';
import { provideTestDefaults } from '../../../testing/test-providers';
import { selectUser } from '../../core/store/auth.reducer';
import { AuthActions } from '../../core/store/auth.actions';

describe('ProfileComponent', () => {
  let fixture: ComponentFixture<ProfileComponent>;
  let store: MockStore;
  let confirmed: boolean;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        ...provideTestDefaults(),
        provideMockStore({ selectors: [{ selector: selectUser, value: { id: '9', name: 'Parent', email: 'p@x.cm', role: 'parent' } }] }),
        { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of({ confirmed }) }) } },
      ],
    }).compileComponents();
    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
    fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
  });

  afterEach(() => store.resetSelectors());

  it('logs out only after confirmation', () => {
    confirmed = false;
    fixture.componentInstance.logout();
    expect(store.dispatch).not.toHaveBeenCalled();
    confirmed = true;
    fixture.componentInstance.logout();
    expect(store.dispatch).toHaveBeenCalledWith(AuthActions.logout());
  });

  it('shows the signed-in parent', () => {
    expect(fixture.nativeElement.textContent).toContain('p@x.cm');
  });
});
