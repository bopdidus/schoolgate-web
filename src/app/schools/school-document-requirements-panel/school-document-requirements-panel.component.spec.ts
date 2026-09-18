import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchoolDocumentRequirementsPanelComponent } from './school-document-requirements-panel.component';
import { provideTestDefaults } from '../../../testing/test-providers';

describe('SchoolDocumentRequirementsPanelComponent', () => {
  let fixture: ComponentFixture<SchoolDocumentRequirementsPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchoolDocumentRequirementsPanelComponent],
      providers: [
        ...provideTestDefaults(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchoolDocumentRequirementsPanelComponent);
    fixture.componentRef.setInput('schoolId', 'school-1');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
