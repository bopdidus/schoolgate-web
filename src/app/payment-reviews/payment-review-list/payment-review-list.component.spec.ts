import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PaymentReviewListComponent } from './payment-review-list.component';
import { SchoolService } from '../../schools/school.service';
import { PaymentChannelReview } from '../../schools/school.model';
import { provideTestDefaults } from '../../../testing/test-providers';

describe('PaymentReviewListComponent', () => {
  let fixture: ComponentFixture<PaymentReviewListComponent>;
  let getPaymentChannelReviews: jasmine.Spy;

  const review: PaymentChannelReview = {
    schoolId: '7',
    schoolName: 'Lycée de Bonamoussadi',
    method: 'mtn',
    mode: 'direct',
    status: 'submitted',
    detailsComplete: true,
    requiredDocuments: [],
    missingDocuments: [],
    submittedAt: '2026-10-16T08:00:00Z',
    reviewedAt: null,
    reviewNote: '',
    testStatus: null,
    testPayerMsisdn: '',
    testAmount: 100,
    activatedAt: null,
  };

  beforeEach(async () => {
    getPaymentChannelReviews = jasmine.createSpy('getPaymentChannelReviews').and.returnValue(of([review]));
    await TestBed.configureTestingModule({
      imports: [PaymentReviewListComponent],
      providers: [...provideTestDefaults(), { provide: SchoolService, useValue: { getPaymentChannelReviews } }],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentReviewListComponent);
    fixture.detectChanges();
  });

  const rows = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row'));

  it('opens on the submitted channels', () => {
    expect(getPaymentChannelReviews).toHaveBeenCalledWith('submitted');
    expect(rows().length).toBe(1);
    expect(rows()[0].textContent).toContain('Lycée de Bonamoussadi');
  });

  it('links to the school page where the documents are reviewed', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('tr.mat-mdc-row a');
    expect(link.getAttribute('href')).toContain('/schools/7');
  });

  it('reloads with the chosen status', () => {
    fixture.componentInstance.onViewChange('suspended');
    expect(getPaymentChannelReviews).toHaveBeenCalledWith('suspended');
  });
});
