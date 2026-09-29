import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeHeroComponent } from './home-hero.component';
import { provideTestDefaults } from '../../../testing/test-providers';

describe('HomeHeroComponent', () => {
  let fixture: ComponentFixture<HomeHeroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeHeroComponent],
      providers: [...provideTestDefaults()],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeHeroComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
