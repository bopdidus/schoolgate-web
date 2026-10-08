import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

/** Same address as the mobile app's support screen. */
export const SUPPORT_EMAIL = 'support@schoolgate.cm';

/** Questions shown in the FAQ (translation keys PARENT.FAQ_Qn / PARENT.FAQ_An). */
export const FAQ_COUNT = 5;

/**
 * Help (mobile support tab): frequent questions and a message to the support
 * team, sent through the parent's own mail app (there is no ticket API).
 */
@Component({
  selector: 'app-parent-support',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './support.component.html',
  styleUrl: './support.component.scss',
})
export class SupportComponent {
  private readonly translate = inject(TranslateService);

  readonly email = SUPPORT_EMAIL;
  readonly faq = Array.from({ length: FAQ_COUNT }, (_, i) => i + 1);

  readonly form = inject(FormBuilder).nonNullable.group({
    subject: ['', Validators.required],
    message: ['', Validators.required],
  });

  /** A mailto: link carrying the subject and message. */
  mailto(): string {
    const { subject, message } = this.form.getRawValue();
    const prefix = this.translate.instant('PARENT.SUPPORT_SUBJECT_PREFIX');
    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`${prefix} ${subject}`.trim())}&body=${encodeURIComponent(message)}`;
  }

  send(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    window.location.href = this.mailto();
  }
}
