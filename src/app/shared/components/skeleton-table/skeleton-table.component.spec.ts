import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkeletonTableComponent } from './skeleton-table.component';
import { provideTestDefaults } from '../../../../testing/test-providers';

describe('SkeletonTableComponent', () => {
  let fixture: ComponentFixture<SkeletonTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonTableComponent],
      providers: [
        ...provideTestDefaults(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonTableComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
