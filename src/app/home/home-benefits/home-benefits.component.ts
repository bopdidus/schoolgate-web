import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

/** What each audience gets: one column for schools, one for parents. */
@Component({
  selector: 'app-home-benefits',
  standalone: true,
  imports: [MatIconModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-benefits.component.html',
  styleUrl: './home-benefits.component.scss',
})
export class HomeBenefitsComponent {
  readonly audiences = [
    {
      icon: 'school',
      title: 'HOME.FOR_SCHOOLS',
      items: ['HOME.SCHOOL_BENEFIT_1', 'HOME.SCHOOL_BENEFIT_2', 'HOME.SCHOOL_BENEFIT_3', 'HOME.SCHOOL_BENEFIT_4'],
    },
    {
      icon: 'family_restroom',
      title: 'HOME.FOR_PARENTS',
      items: ['HOME.PARENT_BENEFIT_1', 'HOME.PARENT_BENEFIT_2', 'HOME.PARENT_BENEFIT_3', 'HOME.PARENT_BENEFIT_4'],
    },
  ];
}
