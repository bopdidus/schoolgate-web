import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchoolEnrollmentsPanelComponent } from './school-enrollments-panel.component';
import { provideTestDefaults } from '../../../testing/test-providers';

describe('SchoolEnrollmentsPanelComponent', () => {
  let fixture: ComponentFixture<SchoolEnrollmentsPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchoolEnrollmentsPanelComponent],
      providers: [
        ...provideTestDefaults(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchoolEnrollmentsPanelComponent);
    fixture.componentRef.setInput('schoolId', 'school-1');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
