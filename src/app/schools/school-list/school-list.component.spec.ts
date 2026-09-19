import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { SchoolListComponent } from './school-list.component';
import { SchoolService } from '../school.service';
import { School, SchoolFilters } from '../school.model';
import { provideTestDefaults } from '../../../testing/test-providers';

describe('SchoolListComponent', () => {
  let fixture: ComponentFixture<SchoolListComponent>;
  let schoolService: jasmine.SpyObj<SchoolService>;

  const pendingSchool = {
    id: '9',
    name: 'Lycée de Test',
    city: 'Yaoundé',
    status: 'pending',
    schoolSystem: 'francophone',
    classes: [],
  } as unknown as School;

  async function render(queryParams: Record<string, string> = {}): Promise<void> {
    schoolService = jasmine.createSpyObj('SchoolService', ['getAll', 'validate']);
    schoolService.getAll.and.callFake((f: SchoolFilters) =>
      of({ data: f.status === 'pending' ? [pendingSchool] : [], total: 1, page: 1, page_size: 10 }),
    );
    schoolService.validate.and.returnValue(of({ ...pendingSchool, status: 'active' } as School));

    await TestBed.configureTestingModule({
      imports: [SchoolListComponent],
      providers: [
        ...provideTestDefaults(),
        { provide: SchoolService, useValue: schoolService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchoolListComponent);
    fixture.detectChanges();
  }

  it('lists active schools by default', async () => {
    await render();
    expect(schoolService.getAll).toHaveBeenCalledWith(jasmine.objectContaining({ status: 'active' }));
  });

  // The dashboard card and the bell open /schools?status=pending.
  it('opens on the pending schools when asked in the URL', async () => {
    await render({ status: 'pending' });
    expect(schoolService.getAll).toHaveBeenCalledWith(jasmine.objectContaining({ status: 'pending' }));
  });

  it('validates a pending school, then reloads the list', async () => {
    await render({ status: 'pending' });
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button.validate-btn');
    expect(button).not.toBeNull();

    button.click();

    expect(schoolService.validate).toHaveBeenCalledWith('9');
    expect(schoolService.getAll).toHaveBeenCalledTimes(2);
  });
});
