/**
 * Resolves a CSS custom property to the colour actually painted.
 *
 * Reading `--mat-sys-primary` with `getComputedStyle` returns the *declared*
 * value, which for this theme is the literal string `light-dark(#016a61,
 * #84d5c9)` — useless to a canvas renderer. Painting the variable onto a probe
 * element and reading back its `color` makes the browser resolve `light-dark()`
 * (and any `color-mix()`) for the scheme currently in force.
 *
 * Used to give charts the same palette as the rest of the interface, in both
 * themes, instead of the hardcoded hexes they carried before.
 */
export function resolveCssColor(variable: string, fallback = '#000000'): string {
  if (typeof document === 'undefined') return fallback;

  const probe = document.createElement('span');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.color = `var(${variable})`;
  document.body.appendChild(probe);

  const resolved = getComputedStyle(probe).color;
  probe.remove();

  return resolved || fallback;
}

/** Same colour, at a given alpha — for chart fills under a line. */
export function withAlpha(color: string, alpha: number): string {
  const match = color.match(/^rgba?\(([^)]+)\)$/);
  if (!match) return color;
  const [r, g, b] = match[1].split(',').map((part) => part.trim());
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
