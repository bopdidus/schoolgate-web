import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchoolFormComponent } from './school-form.component';
import { provideTestDefaults } from '../../../testing/test-providers';

describe('SchoolFormComponent', () => {
  let fixture: ComponentFixture<SchoolFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchoolFormComponent],
      providers: [
        ...provideTestDefaults(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchoolFormComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
