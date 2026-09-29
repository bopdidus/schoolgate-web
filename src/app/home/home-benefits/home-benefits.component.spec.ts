import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeBenefitsComponent } from './home-benefits.component';
import { provideTestDefaults } from '../../../testing/test-providers';

describe('HomeBenefitsComponent', () => {
  let fixture: ComponentFixture<HomeBenefitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeBenefitsComponent],
      providers: [...provideTestDefaults()],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeBenefitsComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
