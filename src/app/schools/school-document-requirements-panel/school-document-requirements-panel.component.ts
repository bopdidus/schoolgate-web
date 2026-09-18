import { Component, inject, input, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { SchoolService } from '../school.service';
import { RefDocumentType, RefService } from '../../core/services/ref.service';
import { DocumentPurpose, DocumentRequirement } from '../school.model';
import { SkeletonTableComponent } from '../../shared/components/skeleton-table/skeleton-table.component';
import { NotificationService } from '../../core/services/notification.service';
import { AbilityService } from '../../core/services/ability.service';

@Component({
  selector: 'app-school-document-requirements-panel',
  standalone: true,
  imports: [
    MatCardModule,
    MatCheckboxModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    TranslateModule,
    SkeletonTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './school-document-requirements-panel.component.html',
  styleUrl: './school-document-requirements-panel.component.scss',
})
export class SchoolDocumentRequirementsPanelComponent implements OnInit {
  readonly schoolId = input.required<string>();

  private readonly schoolService = inject(SchoolService);
  private readonly refService = inject(RefService);
  private readonly notification = inject(NotificationService);
  private readonly abilities = inject(AbilityService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly documentTypes = signal<RefDocumentType[]>([]);
  /** Selected document-type ids per purpose, editable via checkboxes. */
  readonly enrollmentSelection = signal<Set<string>>(new Set());
  readonly paymentSelection = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.load();
  }

  /** Role *and* scope: only this school's admin (or a platform admin) edits it. */
  canManage(): boolean {
    return this.abilities.can('manage', 'DocumentRequirement', { schoolId: this.schoolId() });
  }

  load(): void {
    this.loading.set(true);
    forkJoin({
      types: this.refService.getDocumentTypes(),
      requirements: this.schoolService.getDocumentRequirements(this.schoolId()),
    }).subscribe({
      next: ({ types, requirements }) => {
        this.documentTypes.set(types);
        this.enrollmentSelection.set(
          new Set(requirements.filter((r) => r.purpose === 'enrollment').map((r) => r.documentTypeId)),
        );
        this.paymentSelection.set(
          new Set(
            requirements.filter((r) => r.purpose === 'tuition_payment').map((r) => r.documentTypeId),
          ),
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  isChecked(purpose: DocumentPurpose, typeId: string): boolean {
    const set = purpose === 'enrollment' ? this.enrollmentSelection() : this.paymentSelection();
    return set.has(typeId);
  }

  toggle(purpose: DocumentPurpose, typeId: string): void {
    const signalRef = purpose === 'enrollment' ? this.enrollmentSelection : this.paymentSelection;
    const next = new Set(signalRef());
    if (next.has(typeId)) {
      next.delete(typeId);
    } else {
      next.add(typeId);
    }
    signalRef.set(next);
  }

  hasAnyRequirement(): boolean {
    return this.enrollmentSelection().size > 0 || this.paymentSelection().size > 0;
  }

  labelFor(typeId: string): string {
    return this.documentTypes().find((t) => t.id === typeId)?.label ?? typeId;
  }

  save(): void {
    const requirements: DocumentRequirement[] = [
      ...Array.from(this.enrollmentSelection()).map(
        (documentTypeId): DocumentRequirement => ({
          documentTypeId,
          purpose: 'enrollment',
          required: true,
        }),
      ),
      ...Array.from(this.paymentSelection()).map(
        (documentTypeId): DocumentRequirement => ({
          documentTypeId,
          purpose: 'tuition_payment',
          required: true,
        }),
      ),
    ];
    this.saving.set(true);
    this.schoolService.setDocumentRequirements(this.schoolId(), requirements).subscribe({
      next: () => {
        this.saving.set(false);
        this.notification.success('SCHOOLS.DOCUMENT_REQUIREMENTS_SAVED');
      },
      error: () => {
        this.saving.set(false);
        this.notification.error('COMMON.ERROR');
      },
    });
  }

  trackByTypeId(_: number, type: RefDocumentType): string {
    return type.id;
  }
}
