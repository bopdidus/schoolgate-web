import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PasswordResetListComponent } from './password-reset-list.component';
import { PasswordResetService } from '../password-reset.service';
import { PasswordResetFilters, PasswordResetRequest } from '../password-reset.model';
import { provideTestDefaults } from '../../../testing/test-providers';

describe('PasswordResetListComponent', () => {
  let fixture: ComponentFixture<PasswordResetListComponent>;
  let getAll: jasmine.Spy;

  const pending: PasswordResetRequest = {
    id: '4',
    userId: '8',
    name: 'My Verifadmin',
    email: 'admin@verif.com',
    role: 'school_admin',
    status: 'pending',
    requestedAt: '2026-09-19T04:54:58Z',
    resolvedAt: null,
  };
  const resolved: PasswordResetRequest = { ...pending, id: '3', status: 'resolved', resolvedAt: '2026-09-19T06:00:00Z' };

  beforeEach(async () => {
    getAll = jasmine
      .createSpy('getAll')
      .and.callFake((f: PasswordResetFilters) =>
        of({ data: f.status === 'pending' ? [pending] : [pending, resolved], total: 2, page: 1, page_size: 10 }),
      );
    await TestBed.configureTestingModule({
      imports: [PasswordResetListComponent],
      providers: [...provideTestDefaults(), { provide: PasswordResetService, useValue: { getAll } }],
    }).compileComponents();

    fixture = TestBed.createComponent(PasswordResetListComponent);
    fixture.detectChanges();
  });

  const rows = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row'));

  it('opens on the requests still to handle', () => {
    expect(getAll).toHaveBeenCalledWith(jasmine.objectContaining({ status: 'pending' }));
    expect(rows().length).toBe(1);
    expect(rows()[0].textContent).toContain('admin@verif.com');
  });

  it('lists every status when switching to "all"', () => {
    fixture.componentInstance.onViewChange('all');
    fixture.detectChanges();

    expect(getAll).toHaveBeenCalledWith(jasmine.objectContaining({ status: undefined }));
    expect(rows().length).toBe(2);
  });

  it('links each request to the user page, where the password is reset', () => {
    const link = rows()[0].querySelector('a.open-user-btn');
    expect(link?.getAttribute('href')).toBe('/users/8');
  });
});
