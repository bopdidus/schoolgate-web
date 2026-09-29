import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotFoundComponent } from './not-found.component';
import { provideTestDefaults } from '../../testing/test-providers';

describe('NotFoundComponent', () => {
  let fixture: ComponentFixture<NotFoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundComponent],
      providers: [
        ...provideTestDefaults(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
