import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { HomeHeaderComponent } from './home-header/home-header.component';
import { HomeHeroComponent } from './home-hero/home-hero.component';
import { HomeHowItWorksComponent } from './home-how-it-works/home-how-it-works.component';
import { HomeBenefitsComponent } from './home-benefits/home-benefits.component';

/**
 * Public landing page (`/`): what SchoolGate — by Senior Digital Soft — does
 * and how, with the ways in: sign in or register a school.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    TranslateModule,
    HomeHeaderComponent,
    HomeHeroComponent,
    HomeHowItWorksComponent,
    HomeBenefitsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  readonly year = new Date().getFullYear();
}
