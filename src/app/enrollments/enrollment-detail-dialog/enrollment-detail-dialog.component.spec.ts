import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { EnrollmentDetailDialogComponent } from './enrollment-detail-dialog.component';
import { provideTestDefaults } from '../../../testing/test-providers';

describe('EnrollmentDetailDialogComponent', () => {
  let fixture: ComponentFixture<EnrollmentDetailDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnrollmentDetailDialogComponent],
      providers: [
        ...provideTestDefaults(),
        { provide: MatDialogRef, useValue: jasmine.createSpyObj('MatDialogRef', ['close']) },
        { provide: MAT_DIALOG_DATA, useValue: { id: 'enrollment-1' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EnrollmentDetailDialogComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
