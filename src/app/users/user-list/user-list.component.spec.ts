import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { UserListComponent } from './user-list.component';
import { UserService } from '../user.service';
import { User } from '../../core/models/auth.model';
import { provideTestDefaults } from '../../../testing/test-providers';

describe('UserListComponent', () => {
  let fixture: ComponentFixture<UserListComponent>;

  const staff: User = {
    id: '8',
    email: 'admin@verif.com',
    name: 'My Verifadmin',
    role: 'school_admin',
    isActive: true,
    createdAt: '',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserListComponent],
      providers: [
        ...provideTestDefaults(),
        {
          provide: UserService,
          useValue: { getAll: () => of({ data: [staff], total: 1, page: 1, page_size: 10 }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    fixture.detectChanges();
  });

  const row = (): HTMLElement => fixture.nativeElement.querySelector('tr.mat-mdc-row');

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('opens the user page when a row is clicked', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

    row().click();

    expect(navigate).toHaveBeenCalledWith(['/users', '8']);
  });

  it('links the name to the user page, for keyboard users', () => {
    expect(row().querySelector('a.user-link')?.getAttribute('href')).toBe('/users/8');
  });
});
