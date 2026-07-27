import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Input,
  OnInit,
  Optional,
  Self,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ControlValueAccessor,
  FormControl,
  NgControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  of,
  switchMap,
} from 'rxjs';
import { RefCity, RefRepository } from '../../../core/ref/ref.repository';

/**
 * Searchable city dropdown backed by `GET /reference/cities?q=`.
 * Writes the selected city **id** (number) into the parent form control.
 */
@Component({
  selector: 'app-city-autocomplete',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field appearance="outline" class="city-field">
      <mat-label>{{ labelKey | translate }}</mat-label>
      <input
        matInput
        [formControl]="searchCtrl"
        [matAutocomplete]="cityAuto"
        [required]="required"
        autocomplete="off"
        (blur)="onBlur()"
      />
      @if (loading()) {
        <mat-spinner matSuffix diameter="18" />
      }
      <mat-autocomplete
        #cityAuto="matAutocomplete"
        [displayWith]="displayCity"
        (optionSelected)="onSelected($event)"
      >
        @for (city of options(); track city.id) {
          <mat-option [value]="city">
            <span>{{ cityLabel(city) }}</span>
          </mat-option>
        }
        @if (!loading() && hasQuery() && options().length === 0) {
          <mat-option disabled>{{ 'COMMON.NO_DATA' | translate }}</mat-option>
        }
      </mat-autocomplete>
      @if (showRequiredError()) {
        <mat-error>{{ 'COMMON.REQUIRED' | translate }}</mat-error>
      }
    </mat-form-field>
  `,
  styles: `
    :host {
      display: block;
    }
    .city-field {
      width: 100%;
    }
  `,
})
export class CityAutocompleteComponent implements OnInit, ControlValueAccessor {
  private readonly refRepository = inject(RefRepository);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly query$ = new Subject<string>();

  @Input() labelKey = 'SCHOOLS.CITY';
  @Input() required = false;

  readonly searchCtrl = new FormControl<string | RefCity>('', { nonNullable: true });
  readonly options = signal<RefCity[]>([]);
  readonly loading = signal(false);

  selectedId: number | null = null;
  private selectedLabel = '';

  private onChange: (value: number | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor(@Optional() @Self() private readonly ngControl: NgControl | null) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    this.query$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((q) => {
          this.loading.set(true);
          return this.refRepository.searchCities(q).pipe(
            catchError(() => of([] as RefCity[])),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((cities) => {
        this.options.set(cities);
        this.tryResolveSelected(cities);
        this.cdr.markForCheck();
      });

    this.searchCtrl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      if (typeof value !== 'string') {
        return;
      }
      if (value !== this.selectedLabel) {
        this.selectedId = null;
        this.selectedLabel = '';
        this.onChange(null);
      }
      this.query$.next(value.trim());
    });

    this.query$.next('');
  }

  writeValue(value: number | string | null): void {
    const id = value == null || value === '' ? null : Number(value);
    this.selectedId = id != null && !Number.isNaN(id) && id > 0 ? id : null;
    this.selectedLabel = '';
    this.searchCtrl.setValue('', { emitEvent: false });

    if (this.selectedId != null) {
      this.loading.set(true);
      this.refRepository
        .searchCities('')
        .pipe(
          catchError(() => of([] as RefCity[])),
          finalize(() => this.loading.set(false)),
        )
        .subscribe((cities) => {
          this.options.set(cities);
          this.tryResolveSelected(cities);
          this.cdr.markForCheck();
        });
    }
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.searchCtrl.disable({ emitEvent: false });
    } else {
      this.searchCtrl.enable({ emitEvent: false });
    }
  }

  onSelected(event: MatAutocompleteSelectedEvent): void {
    const city = event.option.value as RefCity;
    this.selectedId = city.id;
    this.selectedLabel = this.cityLabel(city);
    this.onChange(city.id);
    this.onTouched();
  }

  onBlur(): void {
    this.onTouched();
    this.cdr.markForCheck();
  }

  showRequiredError(): boolean {
    const control = this.ngControl?.control;
    return !!this.required && !!control?.touched && this.selectedId == null;
  }

  hasQuery(): boolean {
    const value = this.searchCtrl.value;
    return typeof value === 'string' ? value.trim().length > 0 : !!value;
  }

  displayCity = (value: string | RefCity | null): string => {
    if (!value) return this.selectedLabel;
    if (typeof value === 'string') return value;
    return this.cityLabel(value);
  };

  cityLabel(city: RefCity): string {
    return city.adminName ? `${city.name}, ${city.adminName}` : city.name;
  }

  private tryResolveSelected(cities: RefCity[]): void {
    if (this.selectedId == null) return;
    const match = cities.find((c) => c.id === this.selectedId);
    if (!match) return;
    this.selectedLabel = this.cityLabel(match);
    this.searchCtrl.setValue(match, { emitEvent: false });
  }
}
