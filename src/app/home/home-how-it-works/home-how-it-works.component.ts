import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

/** The enrollment journey in four steps, from the school's sign-up to the invoice. */
@Component({
  selector: 'app-home-how-it-works',
  standalone: true,
  imports: [MatIconModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-how-it-works.component.html',
  styleUrl: './home-how-it-works.component.scss',
})
export class HomeHowItWorksComponent {
  readonly steps = [
    { icon: 'domain_add', title: 'HOME.STEP_1_TITLE', text: 'HOME.STEP_1_TEXT' },
    { icon: 'travel_explore', title: 'HOME.STEP_2_TITLE', text: 'HOME.STEP_2_TEXT' },
    { icon: 'fact_check', title: 'HOME.STEP_3_TITLE', text: 'HOME.STEP_3_TEXT' },
    { icon: 'receipt_long', title: 'HOME.STEP_4_TITLE', text: 'HOME.STEP_4_TEXT' },
  ];
}
