import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrandLogoComponent } from './brand-logo.component';
import { provideTestDefaults } from '../../../../testing/test-providers';

describe('BrandLogoComponent', () => {
  let fixture: ComponentFixture<BrandLogoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrandLogoComponent],
      providers: [
        ...provideTestDefaults(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BrandLogoComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
