import { Component, inject, input, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { SchoolService } from '../school.service';
import { MatriculeVerificationMode, School } from '../school.model';
import { NotificationService } from '../../core/services/notification.service';
import { AbilityService } from '../../core/services/ability.service';

@Component({
  selector: 'app-school-matricule-verification-panel',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    TranslateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './school-matricule-verification-panel.component.html',
  styleUrl: './school-matricule-verification-panel.component.scss',
})
export class SchoolMatriculeVerificationPanelComponent implements OnInit {
  readonly schoolId = input.required<string>();
  readonly school = input.required<School>();

  private readonly schoolService = inject(SchoolService);
  private readonly notification = inject(NotificationService);
  private readonly abilities = inject(AbilityService);

  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly allowBypass = signal(false);
  readonly mode = signal<MatriculeVerificationMode>('none');
  readonly apiUrl = signal('');
  readonly apiKey = signal('');
  readonly apiKeySet = signal(false);
  readonly rosterUploaded = signal(false);

  ngOnInit(): void {
    this.resetFromSchool();
  }

  /** Role *and* scope: only this school's admin (or a platform admin) configures it. */
  canManage(): boolean {
    return this.abilities.can('update', 'School', { schoolId: this.schoolId() });
  }

  private resetFromSchool(): void {
    const info = this.school().matriculeVerification;
    this.allowBypass.set(info.allowDirectPaymentForReturningStudents);
    this.mode.set(info.mode);
    this.apiUrl.set(info.apiUrl ?? '');
    this.apiKeySet.set(info.apiKeySet);
    this.rosterUploaded.set(info.rosterUploaded);
    this.apiKey.set('');
  }

  save(): void {
    this.saving.set(true);
    this.schoolService
      .setMatriculeVerificationConfig(this.schoolId(), {
        allowDirectPaymentForReturningStudents: this.allowBypass(),
        mode: this.mode(),
        apiUrl: this.mode() === 'api' ? this.apiUrl() : undefined,
        // Resend the existing key when the admin didn't type a new one, so
        // toggling other fields never silently wipes it (see model doc).
        apiKey: this.mode() === 'api' ? this.apiKey() || undefined : undefined,
      })
      .subscribe({
        next: (school) => {
          this.saving.set(false);
          this.apiKeySet.set(school.matriculeVerification.apiKeySet);
          this.apiKey.set('');
          this.notification.success('SCHOOLS.MATRICULE_VERIFICATION_SAVED');
        },
        error: () => {
          this.saving.set(false);
          this.notification.error('COMMON.ERROR');
        },
      });
  }

  onRosterSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.uploading.set(true);
    this.schoolService.uploadMatriculeRoster(this.schoolId(), file).subscribe({
      next: (school) => {
        this.uploading.set(false);
        this.rosterUploaded.set(school.matriculeVerification.rosterUploaded);
        this.notification.success('SCHOOLS.MATRICULE_ROSTER_UPLOADED');
      },
      error: () => {
        this.uploading.set(false);
        this.notification.error('COMMON.ERROR');
      },
    });
  }
}
