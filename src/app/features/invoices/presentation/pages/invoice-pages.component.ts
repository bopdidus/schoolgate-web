import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';
import { InvoiceRepository } from '../../infrastructure/invoice.repository';
import { Invoice, InvoiceVerification } from '../../domain/models/invoice.model';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SkeletonTableComponent } from '../../../../shared/components/skeleton-table/skeleton-table.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { StatusColorPipe } from '../../../../shared/pipes/status-color.pipe';
import { XafCurrencyPipe } from '../../../../shared/pipes/xaf-currency.pipe';
import { LocaleDatePipe } from '../../../../shared/pipes/locale-date.pipe';

@Component({
  selector: 'app-invoice-list-page',
  standalone: true,
  imports: [
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    TranslateModule,
    PageHeaderComponent,
    SkeletonTableComponent,
    EmptyStateComponent,
    StatusColorPipe,
    XafCurrencyPipe,
    LocaleDatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invoice-list-page.component.html',
})
export class InvoiceListPageComponent implements OnInit {
  private readonly repository = inject(InvoiceRepository);

  readonly loading = signal(true);
  readonly invoices = signal<Invoice[]>([]);
  readonly total = signal(0);
  readonly page = signal(0);
  readonly pageSize = signal(10);

  readonly displayedColumns = ['student', 'school', 'amount', 'issuedAt', 'status', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.repository.getAll({ page: this.page() + 1, pageSize: this.pageSize() }).subscribe({
      next: (r) => {
        this.invoices.set(r.data);
        this.total.set(r.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  trackById(_: number, i: Invoice): string {
    return i.id;
  }
}

@Component({
  selector: 'app-invoice-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    TranslateModule,
    PageHeaderComponent,
    SkeletonTableComponent,
    XafCurrencyPipe,
    LocaleDatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invoice-detail-page.component.html',
  styleUrl: './invoice-detail-page.component.scss',
})
export class InvoiceDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly repository = inject(InvoiceRepository);

  readonly loading = signal(true);
  readonly invoice = signal<Invoice | null>(null);
  readonly verification = signal<InvoiceVerification | null>(null);
  readonly verifying = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.repository.getById(id).subscribe({
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
    this.repository.verify(inv.uuid).subscribe({
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
