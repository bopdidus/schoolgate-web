import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FAQ_COUNT, SUPPORT_EMAIL, SupportComponent } from './support.component';
import { provideTestDefaults } from '../../../testing/test-providers';

describe('SupportComponent', () => {
  let fixture: ComponentFixture<SupportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SupportComponent], providers: [...provideTestDefaults()] }).compileComponents();
    fixture = TestBed.createComponent(SupportComponent);
    fixture.detectChanges();
  });

  it('lists every FAQ entry', () => {
    expect(fixture.componentInstance.faq.length).toBe(FAQ_COUNT);
  });

  it('builds a mail to the support team with the subject and message', () => {
    const c = fixture.componentInstance;
    c.form.setValue({ subject: 'Paiement', message: 'Bonjour & merci' });
    const link = c.mailto();
    expect(link.startsWith(`mailto:${SUPPORT_EMAIL}?subject=`)).toBeTrue();
    expect(link).toContain(encodeURIComponent('Bonjour & merci'));
  });

  it('asks for a subject and a message before opening the mail app', () => {
    const c = fixture.componentInstance;
    c.send();
    expect(c.form.controls.subject.touched).toBeTrue();
  });
});
