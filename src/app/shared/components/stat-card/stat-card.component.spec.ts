import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatCardComponent } from './stat-card.component';
import { provideTestDefaults } from '../../../../testing/test-providers';

describe('StatCardComponent', () => {
  let fixture: ComponentFixture<StatCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatCardComponent],
      providers: [
        ...provideTestDefaults(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StatCardComponent);
    fixture.componentRef.setInput('label', 'Schools');
    fixture.componentRef.setInput('value', 12);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('is not a link by default', () => {
    expect(fixture.nativeElement.querySelector('a')).toBeNull();
  });

  it('becomes a link to the given route when link is set', () => {
    fixture.componentRef.setInput('link', '/password-resets');
    fixture.detectChanges();

    const anchor: HTMLAnchorElement | null = fixture.nativeElement.querySelector('a.stat-card-link');
    expect(anchor?.getAttribute('href')).toBe('/password-resets');
    expect(anchor?.querySelector('.stat-value')?.textContent?.trim()).toBe('12');
  });
});
