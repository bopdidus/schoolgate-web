import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnrollmentListComponent } from './enrollment-list.component';
import { provideTestDefaults } from '../../../testing/test-providers';

describe('EnrollmentListComponent', () => {
  let fixture: ComponentFixture<EnrollmentListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnrollmentListComponent],
      providers: [
        ...provideTestDefaults(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EnrollmentListComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
