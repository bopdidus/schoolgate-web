import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassFormComponent } from './class-form.component';
import { provideTestDefaults } from '../../../testing/test-providers';

describe('ClassFormComponent', () => {
  let fixture: ComponentFixture<ClassFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassFormComponent],
      providers: [
        ...provideTestDefaults(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClassFormComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
