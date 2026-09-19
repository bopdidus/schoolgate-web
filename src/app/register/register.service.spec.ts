import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { RegisterService, SchoolRegistrationResult } from './register.service';
import { provideTestDefaults } from '../../testing/test-providers';

describe('RegisterService', () => {
  let service: RegisterService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideTestDefaults() });
    service = TestBed.inject(RegisterService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('posts the sign-up, leaving blank optional fields out, and maps the result', () => {
    let result: SchoolRegistrationResult | undefined;
    service
      .register({
        school: { name: ' Lycée de Test ', cityId: 1, system: 'francophone', address: '', phone: '', email: '  ' },
        admin: { firstName: 'Awa', lastName: 'Mbida', email: 'awa@lycee-test.cm', phone: '', password: 'Passw0rd!' },
      })
      .subscribe((r) => (result = r));

    const req = http.expectOne((r) => r.url.endsWith('/auth/school-registrations'));
    expect(req.request.method).toBe('POST');
    // What goes over the wire: JSON drops the fields left undefined.
    const sent = JSON.parse(JSON.stringify(req.request.body));
    expect(sent.school).toEqual({ name: 'Lycée de Test', city_id: 1, system: 'francophone' });
    expect(req.request.body.admin.password).toBe('Passw0rd!');
    req.flush({ code: 'OK', data: { school_id: 9, status: 'pending', admin_email: 'awa@lycee-test.cm' } });

    expect(result).toEqual({ schoolId: '9', status: 'pending', adminEmail: 'awa@lycee-test.cm' });
  });
});
