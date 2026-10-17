import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TuitionLookupComponent } from './tuition-lookup.component';
import { provideTestDefaults } from '../../../testing/test-providers';
import { ParentEnrollmentsService } from '../services/parent-enrollments.service';
import { ParentEnrollment } from '../domain/models';

describe('TuitionLookupComponent', () => {
  let fixture: ComponentFixture<TuitionLookupComponent>;
  let findStudent: jasmine.Spy;

  beforeEach(async () => {
    findStudent = jasmine.createSpy('findStudent').and.returnValue(
      of([
        { id: '1', status: 'active', schoolId: '7' },
        { id: '2', status: 'pending', schoolId: '3' },
        { id: '3', status: 'active', schoolId: '3' },
      ] as ParentEnrollment[]),
    );
    await TestBed.configureTestingModule({
      imports: [TuitionLookupComponent],
      providers: [...provideTestDefaults(), { provide: ParentEnrollmentsService, useValue: { findStudent } }],
    }).compileComponents();
    fixture = TestBed.createComponent(TuitionLookupComponent);
    fixture.componentRef.setInput('schoolId', '3');
    fixture.detectChanges();
  });

  it('needs at least two characters', () => {
    fixture.componentInstance.term.setValue('a');
    fixture.componentInstance.search();
    expect(findStudent).not.toHaveBeenCalled();
  });

  it('keeps accepted enrollments only, the visited school first', () => {
    const c = fixture.componentInstance;
    c.term.setValue('LX-001');
    c.search();
    expect(findStudent).toHaveBeenCalledWith('LX-001');
    expect(c.results().map((e) => e.id)).toEqual(['3', '1']);
    expect(c.searched()).toBeTrue();
  });
});
