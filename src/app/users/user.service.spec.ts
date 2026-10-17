import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { UserService } from './user.service';
import { AuthService as OpenApiAuthService } from '../api';

describe('UserService', () => {
  let api: jasmine.SpyObj<OpenApiAuthService>;
  let service: UserService;

  beforeEach(() => {
    api = jasmine.createSpyObj<OpenApiAuthService>('OpenApiAuthService', [
      'authSchoolUsersGet',
      'authSchoolUsersPost',
      'authSchoolUsersIdGet',
      'authSchoolUsersIdPasswordPut',
    ]);
    TestBed.configureTestingModule({ providers: [{ provide: OpenApiAuthService, useValue: api }] });
    service = TestBed.inject(UserService);
  });

  it('pages school staff accounts', (done) => {
    api.authSchoolUsersGet.and.returnValue(
      of({ data: [{ id: 5, email: 'e@x.cm', first_name: 'Eva', last_name: 'Nkeng', role: 'school_editor', school_id: 3 }], meta: { total: 1 } }) as never,
    );
    service.getAll(1, 10).subscribe((page) => {
      expect(api.authSchoolUsersGet).toHaveBeenCalledWith(undefined, 10, 0);
      expect(page.data[0]).toEqual(jasmine.objectContaining({ id: '5', name: 'Eva Nkeng', role: 'school_editor', schoolId: '3' }));
      done();
    });
  });

  it('splits the full name and attaches the school', () => {
    api.authSchoolUsersPost.and.returnValue(of({ data: { id: 6, first_name: 'Jean', last_name: 'Paul Biya' } }) as never);
    service
      .create({ name: ' Jean  Paul Biya ', email: 'j@x.cm', password: 'secret-123', role: 'school_editor', schoolId: '3' })
      .subscribe();
    expect(api.authSchoolUsersPost).toHaveBeenCalledWith({
      email: 'j@x.cm',
      password: 'secret-123',
      first_name: 'Jean',
      last_name: 'Paul Biya',
      role: 'school_editor',
      school_id: 3,
    } as never);
  });

  it('never creates an admin nor a staff account without school', () => {
    let errors = 0;
    service.create({ name: 'A', email: 'a@x.cm', password: 'p', role: 'admin', schoolId: '3' }).subscribe({ error: () => errors++ });
    service.create({ name: 'A', email: 'a@x.cm', password: 'p', role: 'school_admin' }).subscribe({ error: () => errors++ });
    expect(errors).toBe(2);
    expect(api.authSchoolUsersPost).not.toHaveBeenCalled();
  });

  it('resets a password and reports the requests it closed', (done) => {
    api.authSchoolUsersIdPasswordPut.and.returnValue(of({ data: { resolved_requests: 2 } }) as never);
    service.resetPassword('5', 'new-password-1').subscribe((n) => {
      expect(api.authSchoolUsersIdPasswordPut).toHaveBeenCalledWith(5, { password: 'new-password-1' });
      expect(n).toBe(2);
      done();
    });
  });
});
