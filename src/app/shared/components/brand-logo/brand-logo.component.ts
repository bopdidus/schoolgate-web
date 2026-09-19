import { Component, ChangeDetectionStrategy, input } from '@angular/core';

/**
 * The SchoolGate mark: an arch standing on two posts, read as both a doorway
 * and a school entrance, crossed by an amber lintel — the brand's second colour.
 *
 * Drawn inline as SVG rather than loaded as an asset so it can sit in the icon
 * rail, the login card and the print header without three separate files.
 *
 * The mark's own colours are fixed rather than themed, and deliberately so: a
 * logo carries its own ground, must stay identical in light and dark, and has
 * to match the favicon exactly. The wordmark beside it *is* themed, because it
 * is type sitting on the page surface and has to stay legible there.
 */
@Component({
  selector: 'app-brand-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './brand-logo.component.html',
  styleUrl: './brand-logo.component.scss',
})
export class BrandLogoComponent {
  /** Hides the wordmark, leaving only the tile — for the collapsed icon rail. */
  readonly compact = input(false);
  /** Edge length of the square mark, in pixels. */
  readonly size = input(32);
}
