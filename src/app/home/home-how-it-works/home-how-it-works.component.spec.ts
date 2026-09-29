import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeHowItWorksComponent } from './home-how-it-works.component';
import { provideTestDefaults } from '../../../testing/test-providers';

describe('HomeHowItWorksComponent', () => {
  let fixture: ComponentFixture<HomeHowItWorksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeHowItWorksComponent],
      providers: [...provideTestDefaults()],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeHowItWorksComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
