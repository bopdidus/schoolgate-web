import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';

import { PRIVACY_EMAIL, PrivacyComponent } from './privacy.component';
import { provideTestDefaults } from '../../testing/test-providers';

describe('PrivacyComponent', () => {
  let fixture: ComponentFixture<PrivacyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivacyComponent],
      providers: [...provideTestDefaults()],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('fr', {
      PRIVACY: {
        SECTIONS: [
          { title: 'Données', items: ['Compte', 'Enfants'] },
          { title: 'Droits', paragraphs: ['Accès'] },
        ],
      },
    });
    translate.use('fr');

    fixture = TestBed.createComponent(PrivacyComponent);
    fixture.detectChanges();
  });

  const el = (): HTMLElement => fixture.nativeElement as HTMLElement;

  it('renders every section from the translations, numbered', () => {
    const titles = Array.from(el().querySelectorAll('.privacy__section h2')).map((h) =>
      h.textContent?.trim(),
    );
    expect(titles).toEqual(['1. Données', '2. Droits']);
    expect(el().querySelectorAll('.privacy__section li').length).toBe(2);
  });

  it('gives the privacy contact address to exercise one’s rights', () => {
    const link = el().querySelector('.privacy__contact a');
    expect(link?.getAttribute('href')).toBe(`mailto:${PRIVACY_EMAIL}`);
  });

  it('renders nothing rather than failing while translations are missing', () => {
    expect(fixture.componentInstance.asSections('PRIVACY.SECTIONS')).toEqual([]);
  });
});
