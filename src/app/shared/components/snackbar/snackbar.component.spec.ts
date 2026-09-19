import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

import { SnackbarComponent } from './snackbar.component';
import { provideTestDefaults } from '../../../../testing/test-providers';

describe('SnackbarComponent', () => {
  let fixture: ComponentFixture<SnackbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnackbarComponent],
      providers: [
        ...provideTestDefaults(),
        { provide: MatSnackBarRef, useValue: jasmine.createSpyObj('MatSnackBarRef', ['dismiss']) },
        { provide: MAT_SNACK_BAR_DATA, useValue: { message: 'Saved', type: 'success' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SnackbarComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
