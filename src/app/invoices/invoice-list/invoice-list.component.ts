import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';
import { InvoiceService } from '../invoice.service';
import { Invoice } from '../invoice.model';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SkeletonTableComponent } from '../../shared/components/skeleton-table/skeleton-table.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusColorPipe } from '../../shared/pipes/status-color.pipe';
import { XafCurrencyPipe } from '../../shared/pipes/xaf-currency.pipe';
import { LocaleDatePipe } from '../../shared/pipes/locale-date.pipe';

@Component({
  selector: 'app-invoice-list',
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
  templateUrl: './invoice-list.component.html',
  styleUrl: './invoice-list.component.scss',
})
export class InvoiceListComponent implements OnInit {
  private readonly invoiceService = inject(InvoiceService);

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
    this.invoiceService.getAll({ page: this.page() + 1, pageSize: this.pageSize() }).subscribe({
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
