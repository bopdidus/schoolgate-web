import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchoolListComponent } from './school-list.component';
import { provideTestDefaults } from '../../../testing/test-providers';

describe('SchoolListComponent', () => {
  let fixture: ComponentFixture<SchoolListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchoolListComponent],
      providers: [
        ...provideTestDefaults(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchoolListComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
