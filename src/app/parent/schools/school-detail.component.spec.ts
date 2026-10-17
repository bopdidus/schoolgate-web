import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { SchoolDetailComponent } from './school-detail.component';
import { provideTestDefaults } from '../../../testing/test-providers';
import { ParentSchoolsService } from '../services/parent-schools.service';
import { DocumentRequirement, ParentSchool } from '../domain/models';

describe('SchoolDetailComponent', () => {
  let fixture: ComponentFixture<SchoolDetailComponent>;

  async function setup(deadline: string | null): Promise<void> {
    const requirements: DocumentRequirement[] = [
      { documentType: { id: '1', code: 'birth', label: 'Acte' }, purpose: 'enrollment', required: true },
      { documentType: { id: '2', code: 'other', label: 'Autre' }, purpose: 'tuition_payment', required: false, otherLabel: 'Photo' },
    ];
    await TestBed.configureTestingModule({
      imports: [SchoolDetailComponent],
      providers: [
        ...provideTestDefaults(),
        {
          provide: ParentSchoolsService,
          useValue: {
            getById: () => of({ id: '1', name: 'Lycée X', enrollmentDeadline: deadline, classes: [] } as unknown as ParentSchool),
            documentRequirements: () => of(requirements),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SchoolDetailComponent);
    fixture.componentRef.setInput('id', '1');
    fixture.detectChanges();
  }

  it('is open without a deadline, splits documents by purpose', async () => {
    await setup(null);
    const c = fixture.componentInstance;
    expect(c.enrollmentOpen()).toBeTrue();
    expect(c.enrollmentDocs().length).toBe(1);
    expect(c.docLabel(c.tuitionDocs()[0])).toBe('Photo');
  });

  it('refuses requests after the deadline', async () => {
    await setup('2020-01-01');
    expect(fixture.componentInstance.enrollmentOpen()).toBeFalse();
  });
});
