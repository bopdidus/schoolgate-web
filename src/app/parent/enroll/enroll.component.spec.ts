import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { EnrollComponent } from './enroll.component';
import { provideTestDefaults } from '../../../testing/test-providers';
import { ParentSchoolsService } from '../services/parent-schools.service';
import { ParentEnrollmentsService } from '../services/parent-enrollments.service';
import { NotificationService } from '../../core/services/notification.service';
import { Child, ClassOffering, ParentEnrollment, ParentSchool } from '../domain/models';

const CLASS = (id: string, seats: number): ClassOffering => ({
  id,
  schoolId: '1',
  label: `Classe ${id}`,
  educationType: 'general',
  enrollmentFeeCents: 2_500_000,
  advanceAllowed: false,
  advancePercentage: 0,
  installments: [{ number: 1, amountCents: 5_000_000, dueDate: '2026-11-15', advanceAllowed: false, advancePercentage: 0 }],
  totalSeats: 30,
  seatsRemaining: seats,
});

const SCHOOL = {
  id: '1',
  name: 'Lycée X',
  academicYear: '2026-2027',
  allowsDirectPayment: true,
  classes: [CLASS('10', 4), CLASS('11', 0)],
} as ParentSchool;

describe('EnrollComponent', () => {
  let fixture: ComponentFixture<EnrollComponent>;
  let enrollments: jasmine.SpyObj<ParentEnrollmentsService>;
  let notification: jasmine.SpyObj<NotificationService>;
  let router: Router;

  async function setup(children: Child[], classId?: string): Promise<void> {
    enrollments = jasmine.createSpyObj<ParentEnrollmentsService>('ParentEnrollmentsService', ['children', 'create', 'uploadDocuments']);
    enrollments.children.and.returnValue(of(children));
    enrollments.create.and.returnValue(of({ id: '42' } as ParentEnrollment));
    enrollments.uploadDocuments.and.returnValue(of(undefined));
    notification = jasmine.createSpyObj<NotificationService>('NotificationService', ['error', 'warning', 'success']);
    await TestBed.configureTestingModule({
      imports: [EnrollComponent],
      providers: [
        ...provideTestDefaults(),
        { provide: ParentSchoolsService, useValue: { getById: () => of(SCHOOL), documentRequirements: () => of([]) } },
        { provide: ParentEnrollmentsService, useValue: enrollments },
        { provide: NotificationService, useValue: notification },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(EnrollComponent);
    fixture.componentRef.setInput('schoolId', '1');
    if (classId) fixture.componentRef.setInput('classId', classId);
    fixture.detectChanges();
  }

  it('offers only classes with a seat and preselects the one chosen', async () => {
    await setup([], '10');
    const c = fixture.componentInstance;
    expect(c.openClasses().map((k) => k.id)).toEqual(['10']);
    expect(c.classStep.controls.classId.value).toBe('10');
    expect(c.tuitionTotal(CLASS('10', 1))).toBe(5_000_000);
  });

  it('requires names and gender for a new child, then sends the request', async () => {
    await setup([], '10');
    const c = fixture.componentInstance;
    expect(c.mode()).toBe('new');
    expect(c.student.invalid).toBeTrue();

    c.student.patchValue({ firstName: 'Ada', lastName: 'Lovelace', gender: 'female' });
    expect(c.childName()).toBe('Ada Lovelace');
    await c.submit();

    expect(enrollments.create).toHaveBeenCalledWith(
      jasmine.objectContaining({
        classId: '10',
        academicYear: '2026-2027',
        newChild: { firstName: 'Ada', lastName: 'Lovelace', gender: 'female' },
        childId: undefined,
      }),
    );
    expect(router.navigate).toHaveBeenCalledWith(['/parent/confirmation', '42']);
  });

  it('defaults to a saved child and sends its id', async () => {
    await setup([{ id: '5', firstName: 'Paul', lastName: 'B' }], '10');
    const c = fixture.componentInstance;
    expect(c.mode()).toBe('existing');
    c.student.patchValue({ childId: '5' });
    expect(c.childName()).toBe('Paul B');
    await c.submit();
    expect(enrollments.create).toHaveBeenCalledWith(jasmine.objectContaining({ childId: '5', newChild: undefined }));
  });

  it('refuses a file that is not a PDF or an image', async () => {
    await setup([]);
    const input = document.createElement('input');
    input.type = 'file';
    const bad = new File(['x'], 'virus.exe', { type: 'application/x-msdownload' });
    const good = new File(['%PDF'], 'acte.pdf', { type: 'application/pdf' });
    Object.defineProperty(input, 'files', { value: [bad, good] });
    fixture.componentInstance.onFilesPicked({ target: input } as unknown as Event, '7');
    expect(notification.error).toHaveBeenCalledWith('PARENT.DOCUMENT_BAD_TYPE');
    expect(fixture.componentInstance.filesFor('7').map((f) => f.file.name)).toEqual(['acte.pdf']);
    fixture.componentInstance.removeFile(0);
    expect(fixture.componentInstance.files()).toEqual([]);
  });
});
