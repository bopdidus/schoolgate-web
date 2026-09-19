import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconRailDrawerComponent } from './icon-rail-drawer.component';
import { provideTestDefaults } from '../../../../testing/test-providers';

describe('IconRailDrawerComponent', () => {
  let fixture: ComponentFixture<IconRailDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconRailDrawerComponent],
      providers: [
        ...provideTestDefaults(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IconRailDrawerComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
