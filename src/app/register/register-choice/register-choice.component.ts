import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { BrandLogoComponent } from '../../shared/components/brand-logo/brand-logo.component';

/** First sign-up step: a parent account (as on the mobile app) or a school. */
@Component({
  selector: 'app-register-choice',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, TranslateModule, BrandLogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register-choice.component.html',
  styleUrls: ['../register.component.scss', './register-choice.component.scss'],
})
export class RegisterChoiceComponent {}
