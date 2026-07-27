/**
 * Centralised security timing knobs. Keeping them in one place makes the
 * trade-off between UX and session exposure window explicit and easy to tune
 * without hunting through services.
 */

/** How long the access token is refreshed *before* it actually expires (UX only — avoids doomed in-flight requests; the server remains the real gatekeeper). */
export const PROACTIVE_REFRESH_LEAD_MS = 60_000;

/** Inactivity duration (no mousemove/keydown/scroll/click) before showing the "still there?" warning. */
export const IDLE_TIMEOUT_MS = 15 * 60_000;

/** How long the warning dialog counts down before an automatic logout. */
export const IDLE_WARNING_COUNTDOWN_MS = 60_000;
