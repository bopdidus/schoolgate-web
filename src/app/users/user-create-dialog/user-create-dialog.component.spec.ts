import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';

import { UserCreateDialogComponent } from './user-create-dialog.component';
import { provideTestDefaults } from '../../../testing/test-providers';

describe('UserCreateDialogComponent', () => {
  let fixture: ComponentFixture<UserCreateDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCreateDialogComponent],
      providers: [
        ...provideTestDefaults(),
        { provide: MatDialogRef, useValue: jasmine.createSpyObj('MatDialogRef', ['close']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserCreateDialogComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
