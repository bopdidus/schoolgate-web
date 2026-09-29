import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThemeToggleComponent } from './theme-toggle.component';
import { provideTestDefaults } from '../../../../testing/test-providers';

describe('ThemeToggleComponent', () => {
  let fixture: ComponentFixture<ThemeToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeToggleComponent],
      providers: [
        ...provideTestDefaults(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeToggleComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
