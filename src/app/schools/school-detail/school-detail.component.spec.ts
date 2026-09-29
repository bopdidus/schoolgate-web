import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchoolDetailComponent } from './school-detail.component';
import { provideTestDefaults } from '../../../testing/test-providers';

describe('SchoolDetailComponent', () => {
  let fixture: ComponentFixture<SchoolDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchoolDetailComponent],
      providers: [
        ...provideTestDefaults(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchoolDetailComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
