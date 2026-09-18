import { ComponentFixture, TestBed } from '@angular/core/testing';
import { School } from '../school.model';

import { SchoolMatriculeVerificationPanelComponent } from './school-matricule-verification-panel.component';
import { provideTestDefaults } from '../../../testing/test-providers';

describe('SchoolMatriculeVerificationPanelComponent', () => {
  let fixture: ComponentFixture<SchoolMatriculeVerificationPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchoolMatriculeVerificationPanelComponent],
      providers: [
        ...provideTestDefaults(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchoolMatriculeVerificationPanelComponent);
    fixture.componentRef.setInput('schoolId', 'school-1');
    fixture.componentRef.setInput('school', {
      id: 'school-1',
      matriculeVerification: {
        allowDirectPaymentForReturningStudents: false,
        mode: 'none',
        apiKeySet: false,
        rosterUploaded: false,
      },
    } as unknown as School);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
