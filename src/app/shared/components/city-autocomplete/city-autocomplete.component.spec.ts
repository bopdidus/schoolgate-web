import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CityAutocompleteComponent } from './city-autocomplete.component';
import { provideTestDefaults } from '../../../../testing/test-providers';

describe('CityAutocompleteComponent', () => {
  let fixture: ComponentFixture<CityAutocompleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CityAutocompleteComponent],
      providers: [
        ...provideTestDefaults(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CityAutocompleteComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
