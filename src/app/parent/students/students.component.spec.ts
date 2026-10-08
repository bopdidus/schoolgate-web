import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { provideTestDefaults } from '../../../testing/test-providers';
import { StudentsComponent } from './students.component';
import { ParentEnrollmentsService } from '../services/parent-enrollments.service';
import { ParentEnrollment } from '../domain/models';

function enrollment(id: string, status: ParentEnrollment['status'], settled: boolean): ParentEnrollment {
  return {
    id,
    status,
    academicYear: '2026-2027',
    isReturningStudent: false,
    requiresDocuments: false,
    paymentValidated: true,
    createdAt: '2026-09-01',
    schoolId: '1',
    schoolName: 'Lycée X',
    child: { id: id, firstName: 'Child', lastName: id },
    offering: {
      id: 'c' + id,
      schoolId: '1',
      label: '6ème',
      educationType: 'general',
      enrollmentFeeCents: 0,
      advanceAllowed: false,
      advancePercentage: 0,
      installments: [],
      totalSeats: 1,
      seatsRemaining: 0,
    },
    balance: {
      tuitionTotalCents: 100,
      tuitionPaidCents: settled ? 100 : 0,
      tuitionPendingCents: 0,
      tuitionRemainingCents: settled ? 0 : 100,
      tuitionSettled: settled,
      enrollmentFeeCents: 0,
      enrollmentFeePaidCents: 0,
      enrollmentFeeStatus: 'paid',
    },
  };
}

describe('StudentsComponent', () => {
  let fixture: ComponentFixture<StudentsComponent>;
  let service: jasmine.SpyObj<ParentEnrollmentsService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<ParentEnrollmentsService>('ParentEnrollmentsService', ['list']);
    service.list.and.returnValue(
      of([enrollment('1', 'active', true), enrollment('2', 'active', false), enrollment('3', 'pending', false)]),
    );
    await TestBed.configureTestingModule({
      imports: [StudentsComponent],
      providers: [...provideTestDefaults(), provideRouter([]), { provide: ParentEnrollmentsService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(StudentsComponent);
    fixture.detectChanges();
  });

  it('asks the API for the current academic year by default', () => {
    expect(service.list).toHaveBeenCalledWith(fixture.componentInstance.year());
    expect(fixture.componentInstance.year()).toMatch(/^\d{4}-\d{4}$/);
  });

  it('lists accepted enrollments only, and filters on settled tuition', () => {
    const c = fixture.componentInstance;
    expect(c.rows().map((e) => e.id)).toEqual(['1', '2']);
    c.tuition.set('settled');
    expect(c.rows().map((e) => e.id)).toEqual(['1']);
    c.tuition.set('owing');
    expect(c.rows().map((e) => e.id)).toEqual(['2']);
  });
});
