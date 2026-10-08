import { Component, ChangeDetectionStrategy, inject, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { CentsPipe } from '../shared/cents.pipe';
import { ParentEnrollment } from '../domain/models';
import { ParentEnrollmentsService } from '../services/parent-enrollments.service';

/**
 * Pay a returning student's tuition (mobile tuition lookup): find the student
 * by matricule or name among the account's enrollments, confirm the match,
 * then pay the next installment.
 */
@Component({
  selector: 'app-parent-tuition-lookup',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    TranslateModule,
    PageHeaderComponent,
    CentsPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tuition-lookup.component.html',
  styleUrl: './tuition-lookup.component.scss',
})
export class TuitionLookupComponent {
  /** Query parameter: the school the parent came from, ranked first. */
  readonly schoolId = input<string>();

  private readonly enrollmentsService = inject(ParentEnrollmentsService);

  readonly term = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] });
  readonly searching = signal(false);
  readonly searched = signal(false);
  readonly results = signal<ParentEnrollment[]>([]);

  search(): void {
    if (this.term.invalid) {
      this.term.markAsTouched();
      return;
    }
    this.searching.set(true);
    this.enrollmentsService.findStudent(this.term.value).subscribe({
      next: (items) => {
        const school = this.schoolId();
        // Only accepted enrollments can be paid; the school visited first.
        const active = items.filter((e) => e.status === 'active');
        this.results.set(
          active.sort((a, b) => Number(b.schoolId === school) - Number(a.schoolId === school)),
        );
        this.searched.set(true);
        this.searching.set(false);
      },
      error: () => this.searching.set(false),
    });
  }
}
