import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { InvoiceService } from '../invoice.service';
import { Invoice, InvoiceVerification } from '../invoice.model';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SkeletonTableComponent } from '../../shared/components/skeleton-table/skeleton-table.component';
import { XafCurrencyPipe } from '../../shared/pipes/xaf-currency.pipe';
import { LocaleDatePipe } from '../../shared/pipes/locale-date.pipe';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { BrandLogoComponent } from '../../shared/components/brand-logo/brand-logo.component';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    TranslateModule,
    PageHeaderComponent,
    ErrorStateComponent,
    BrandLogoComponent,
    SkeletonTableComponent,
    XafCurrencyPipe,
    LocaleDatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invoice-detail.component.html',
  styleUrl: './invoice-detail.component.scss',
})
export class InvoiceDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly invoiceService = inject(InvoiceService);

  readonly loading = signal(true);
  readonly invoice = signal<Invoice | null>(null);
  readonly verification = signal<InvoiceVerification | null>(null);
  readonly verifying = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.invoiceService.getById(id).subscribe({
        next: (inv) => {
          this.invoice.set(inv);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  verify(): void {
    const inv = this.invoice();
    if (!inv) return;
    this.verifying.set(true);
    this.invoiceService.verify(inv.uuid).subscribe({
      next: (result) => {
        this.verification.set(result);
        this.verifying.set(false);
      },
      error: () => this.verifying.set(false),
    });
  }

  print(): void {
    window.print();
  }
}
