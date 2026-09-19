import { FocusOrigin } from '@angular/cdk/a11y';
import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import { CdkScrollable } from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  ViewEncapsulation,
  computed,
  forwardRef,
  signal,
} from '@angular/core';
import { MatDrawer, MatDrawerToggleResult } from '@angular/material/sidenav';

/**
 * Adapter (GoF) over {@link MatDrawer}: keeps the standard `opened` contract
 * but reinterprets the closed state as a narrow icon rail instead of sliding
 * the drawer off-screen.
 *
 * - `[opened]="false"` collapses the drawer to `railWidth`; the `.collapsed`
 *   host class lets consumers render an icon-only variant of their content.
 * - The underlying drawer stays physically open, so Material never applies its
 *   off-screen transform/hidden state, and `MatDrawerContainer` keeps
 *   reserving content margins for the rail.
 * - `_getWidth()` is deterministic (no mid-transition `offsetWidth` reads), so
 *   content margins are always exact and animate through the container's own
 *   margin transition — no `transitionend` workaround needed.
 *
 * Drop-in replacement for `<mat-drawer>` in `mode="side"` without backdrop.
 */
@Component({
  selector: 'mat-drawer',
  standalone: true,
  imports: [CdkScrollable],
  template:
    '<div class="mat-drawer-inner-container" cdkScrollable #content><ng-content></ng-content></div>',
  host: {
    class: 'mat-drawer app-icon-rail-drawer',
    '[class.collapsed]': 'railMode()',
    '[style.width.px]': 'railMode() ? railWidth : expandedWidth',
  },
  // Lets MatDrawerContainer's ContentChildren(MatDrawer) query match this component.
  providers: [{ provide: MatDrawer, useExisting: forwardRef(() => IconRailDrawerComponent) }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class IconRailDrawerComponent extends MatDrawer {
  /** Width of the collapsed icon rail. */
  @Input() railWidth = 72;
  /** Width of the expanded drawer. */
  @Input() expandedWidth = 260;

  /** Logical open state backing the adapted contract. */
  private readonly _logicalOpened = signal(true);

  /** Whether the drawer renders as the icon rail (logically "closed"). */
  readonly railMode = computed(() => !this._logicalOpened());

  /**
   * Physical visibility. `MatDrawerContainer` reads this to reserve content
   * margins, so it must reflect the on-screen truth: the adapted drawer never
   * hides, it only narrows.
   */
  override get opened(): boolean {
    return super.opened;
  }

  override set opened(value: BooleanInput) {
    this.toggle(coerceBooleanProperty(value));
  }

  override toggle(
    isOpen: boolean = !this._logicalOpened(),
    _openedVia?: FocusOrigin,
  ): Promise<MatDrawerToggleResult> {
    if (isOpen !== this._logicalOpened()) {
      this._logicalOpened.set(isOpen);
      // Mirrors MatDrawer's own flow: the container listens to this to
      // recompute content margins, which read the overridden `_getWidth()`.
      this._animationStarted.next(undefined);
      this.openedChange.emit(isOpen);
    }
    return Promise.resolve(isOpen ? 'open' : 'close');
  }

  /** Deterministic width — the container must never read a mid-transition `offsetWidth`. */
  override _getWidth(): number {
    return this.railMode() ? this.railWidth : this.expandedWidth;
  }

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    if (!super.opened) {
      // Bypasses the adapter: opens the underlying drawer once so it stays
      // visible no matter the logical (rail) state.
      void super.toggle(true);
    }
  }
}
