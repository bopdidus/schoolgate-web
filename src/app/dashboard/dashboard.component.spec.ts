import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { DashboardService } from './dashboard.service';
import { DashboardOverview } from './dashboard.model';
import { provideTestDefaults } from '../../testing/test-providers';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;

  function overview(extra: Partial<DashboardOverview> = {}): DashboardOverview {
    return {
      role: 'admin',
      stats: { pendingValidations: 0, validatedPayments: 0, seatsFilledPercent: 0 },
      ...extra,
    };
  }

  async function render(data: DashboardOverview): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        ...provideTestDefaults(),
        { provide: DashboardService, useValue: { getOverview: () => of(data) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const resetCard = (el: HTMLElement) => el.querySelector('.password-resets-card');

  it('should create', async () => {
    await render(overview());
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows the password reset requests card when the API sends the count', async () => {
    const el = await render(overview({ pendingPasswordResetRequests: 3 }));

    expect(resetCard(el)?.querySelector('.stat-value')?.textContent?.trim()).toBe('3');
  });

  // Zero is a real answer ("nothing to handle"), not an absent field.
  it('still shows the card when the count is zero', async () => {
    const el = await render(overview({ pendingPasswordResetRequests: 0 }));

    expect(resetCard(el)?.querySelector('.stat-value')?.textContent?.trim()).toBe('0');
  });

  it('hides the card for school staff, whose overview has no count', async () => {
    const el = await render(overview({ role: 'school_admin' }));

    expect(resetCard(el)).toBeNull();
    expect(el.querySelector('.pending-schools-card')).toBeNull();
  });

  it('shows the schools-to-validate card, linking to the pending list', async () => {
    const el = await render(overview({ pendingSchoolRegistrations: 2 }));

    const card = el.querySelector('.pending-schools-card');
    expect(card?.querySelector('.stat-value')?.textContent?.trim()).toBe('2');
    expect(card?.querySelector('a')?.getAttribute('href')).toBe('/schools?status=pending');
  });

  it('keeps three cards per row, so they all have the same size', async () => {
    const el = await render(overview({ pendingPasswordResetRequests: 1, pendingSchoolRegistrations: 2 }));

    expect(el.querySelector('.stats-grid')?.classList).toContain('cols-3');
    expect(el.querySelectorAll('.stats-grid app-stat-card').length).toBe(5);
  });
});
