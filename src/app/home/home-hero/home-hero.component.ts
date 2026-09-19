import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

/** Opening section of the home page: the promise and the two ways in. */
@Component({
  selector: 'app-home-hero',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-hero.component.html',
  styleUrl: './home-hero.component.scss',
})
export class HomeHeroComponent {
  readonly highlights = [
    { icon: 'smartphone', title: 'HOME.HIGHLIGHT_1_TITLE', text: 'HOME.HIGHLIGHT_1_TEXT' },
    { icon: 'payments', title: 'HOME.HIGHLIGHT_2_TITLE', text: 'HOME.HIGHLIGHT_2_TEXT' },
    { icon: 'verified', title: 'HOME.HIGHLIGHT_3_TITLE', text: 'HOME.HIGHLIGHT_3_TEXT' },
  ];
}
