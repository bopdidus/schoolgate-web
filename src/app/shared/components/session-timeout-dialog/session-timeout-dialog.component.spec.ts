import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { SessionTimeoutDialogComponent } from './session-timeout-dialog.component';
import { provideTestDefaults } from '../../../../testing/test-providers';

describe('SessionTimeoutDialogComponent', () => {
  let fixture: ComponentFixture<SessionTimeoutDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionTimeoutDialogComponent],
      providers: [
        ...provideTestDefaults(),
        { provide: MatDialogRef, useValue: jasmine.createSpyObj('MatDialogRef', ['close']) },
        { provide: MAT_DIALOG_DATA, useValue: { countdownMs: 60_000 } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionTimeoutDialogComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
