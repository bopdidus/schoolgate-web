import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { RequestsComponent } from './requests.component';
import { provideTestDefaults } from '../../../testing/test-providers';
import { ParentEnrollmentsService } from '../services/parent-enrollments.service';
import { ParentEnrollment } from '../domain/models';

describe('RequestsComponent', () => {
  let fixture: ComponentFixture<RequestsComponent>;

  async function setup(list$: ReturnType<ParentEnrollmentsService['list']>): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [RequestsComponent],
      providers: [...provideTestDefaults(), { provide: ParentEnrollmentsService, useValue: { list: () => list$ } }],
    }).compileComponents();
    fixture = TestBed.createComponent(RequestsComponent);
    fixture.detectChanges();
  }

  it('lists the newest request first', async () => {
    await setup(
      of([
        { id: '1', createdAt: '2026-09-01', schoolName: 'A', status: 'active' },
        { id: '2', createdAt: '2026-10-01', schoolName: 'B', status: 'pending' },
      ] as ParentEnrollment[]),
    );
    expect(fixture.componentInstance.requests().map((r) => r.id)).toEqual(['2', '1']);
  });

  it('sends a parent without requests to the school search', async () => {
    await setup(of([]));
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.componentInstance.findSchool();
    expect(router.navigate).toHaveBeenCalledWith(['/parent/schools']);
  });

  it('shows an error state when the list fails', async () => {
    await setup(throwError(() => new Error('down')));
    expect(fixture.componentInstance.failed()).toBeTrue();
  });
});
