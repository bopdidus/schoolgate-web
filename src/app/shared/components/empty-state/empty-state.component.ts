import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatCardModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  @Input({ required: true }) icon = 'inbox';
  @Input({ required: true }) title = 'COMMON.NO_DATA';
  @Input() description = '';
  @Input() actionLabel = '';
  @Output() actionClick = new EventEmitter<void>();
}
