import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';

import { SchoolSearchComponent } from './school-search.component';
import { provideTestDefaults } from '../../../testing/test-providers';
import { ParentSchoolsService } from '../services/parent-schools.service';
import { RefService } from '../../core/services/ref.service';
import { ParentSchool } from '../domain/models';

const school = (id: string, name: string, seats: number, tuition: number): ParentSchool =>
  ({
    id,
    name,
    classes: [
      {
        id: `${id}-c`,
        schoolId: id,
        label: '6ème',
        educationType: 'general',
        enrollmentFeeCents: 0,
        advanceAllowed: false,
        advancePercentage: 0,
        installments: [{ number: 1, amountCents: tuition, dueDate: '', advanceAllowed: false, advancePercentage: 0 }],
        totalSeats: 30,
        seatsRemaining: seats,
      },
    ],
  }) as ParentSchool;

describe('SchoolSearchComponent', () => {
  let fixture: ComponentFixture<SchoolSearchComponent>;
  let search: jasmine.Spy;

  beforeEach(async () => {
    search = jasmine.createSpy('search').and.returnValue(
      of({ items: [school('1', 'Lycée B', 2, 9_000_000), school('2', 'Collège A', 20, 5_000_000)], total: 2 }),
    );
    await TestBed.configureTestingModule({
      imports: [SchoolSearchComponent],
      providers: [
        ...provideTestDefaults(),
        { provide: ParentSchoolsService, useValue: { search, levels: () => of([]) } },
        { provide: RefService, useValue: { searchCities: () => of([]) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SchoolSearchComponent);
  });

  it('searches once the parent stops typing, and sorts without a new request', fakeAsync(() => {
    fixture.detectChanges();
    tick(300);
    expect(search).toHaveBeenCalledTimes(1);
    const c = fixture.componentInstance;
    expect(c.sorted().map((s) => s.name)).toEqual(['Collège A', 'Lycée B']);

    c.filters.controls.q.setValue('lyc');
    c.filters.controls.q.setValue('lycée');
    tick(300);
    expect(search).toHaveBeenCalledTimes(2);
    expect(search.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ q: 'lycée', page: 1 }));

    c.filters.controls.sort.setValue('seats');
    tick(300);
    expect(search).toHaveBeenCalledTimes(2);
    expect(c.sorted()[0].name).toBe('Collège A');
    c.filters.controls.sort.setValue('tuition');
    expect(c.sorted()[0].name).toBe('Collège A');
  }));

  it('pages and resets the filters', fakeAsync(() => {
    fixture.detectChanges();
    tick(300);
    const c = fixture.componentInstance;
    c.onPage({ pageIndex: 1, pageSize: c.pageSize, length: 30 });
    expect(search.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ page: 2 }));
    c.filters.controls.system.setValue('anglophone');
    c.resetFilters();
    expect(c.filters.getRawValue().system).toBe('');
    tick(300);
  }));
});
