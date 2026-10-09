import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HomeHeaderComponent } from '../home/home-header/home-header.component';
import { SUPPORT_EMAIL } from '../parent/support/support.component';

/** One heading of the policy, as written in the PRIVACY.SECTIONS translation array. */
export interface PrivacySection {
  title: string;
  paragraphs?: string[];
  items?: string[];
}

/**
 * Public privacy policy (`/privacy`): what SchoolGate collects, why, who
 * receives it and how to exercise one's rights. Reachable without an account
 * (store listings and the sign-up form link to it). The text lives in the
 * translation files so it follows the chosen language.
 */
@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [RouterLink, MatIconModule, TranslateModule, HomeHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss',
})
export class PrivacyComponent {
  readonly email = SUPPORT_EMAIL;
  readonly year = new Date().getFullYear();

  readonly sections = toSignal(
    inject(TranslateService).stream('PRIVACY.SECTIONS'),
    { initialValue: [] },
  );

  /** Untranslated keys come back as the key string itself, not an array. */
  asSections(value: unknown): PrivacySection[] {
    return Array.isArray(value) ? (value as PrivacySection[]) : [];
  }
}
