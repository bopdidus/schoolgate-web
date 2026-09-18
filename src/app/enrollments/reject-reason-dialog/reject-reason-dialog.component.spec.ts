import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { RejectReasonDialogComponent } from './reject-reason-dialog.component';

describe('RejectReasonDialogComponent', () => {
  let component: RejectReasonDialogComponent;
  let dialogRef: jasmine.SpyObj<MatDialogRef<RejectReasonDialogComponent>>;

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    await TestBed.configureTestingModule({
      imports: [RejectReasonDialogComponent, TranslateModule.forRoot()],
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { studentName: 'Test Student' } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(RejectReasonDialogComponent);
    component = fixture.componentInstance;
  });

  // Aligned on the API contract: rejection_reason requires >= 10 characters.
  it('rejects a reason shorter than 10 characters', () => {
    component.form.controls.reason.setValue('too short');
    expect(component.form.invalid).toBeTrue();

    component.confirm();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('accepts a reason of at least 10 characters and closes with it', () => {
    const reason = 'Dossier incomplet, merci de fournir les bulletins.';
    component.form.controls.reason.setValue(reason);
    expect(component.form.valid).toBeTrue();

    component.confirm();
    expect(dialogRef.close).toHaveBeenCalledWith(reason);
  });

  it('requires a reason', () => {
    component.form.controls.reason.setValue('');
    expect(component.form.invalid).toBeTrue();
  });
});
