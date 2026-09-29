import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceDetailComponent } from './invoice-detail.component';
import { provideTestDefaults } from '../../../testing/test-providers';

describe('InvoiceDetailComponent', () => {
  let fixture: ComponentFixture<InvoiceDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceDetailComponent],
      providers: [
        ...provideTestDefaults(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceDetailComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
