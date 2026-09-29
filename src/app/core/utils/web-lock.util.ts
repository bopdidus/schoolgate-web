import { NgZone } from '@angular/core';
import { Observable, Subscription, finalize } from 'rxjs';

/**
 * Runs `source$` while holding the browser-wide Web Lock `name`, so the same
 * work never overlaps across tabs of this origin: a second caller (in any tab)
 * only subscribes to its `source$` once the first one has completed or failed.
 *
 * The lock is released when the source completes, errors or is unsubscribed; an
 * unsubscribe while still waiting simply leaves the queue. Browsers without the
 * Web Locks API run `source$` directly.
 *
 * The lock callback is invoked by the browser outside Angular's zone, so the
 * source is subscribed back inside `zone` for change detection to see results.
 */
export function withWebLock<T>(name: string, source$: Observable<T>, zone: NgZone): Observable<T> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  if (!locks) return source$;

  return new Observable<T>((subscriber) => {
    const abort = new AbortController();
    let inner: Subscription | undefined;

    locks
      .request(name, { signal: abort.signal }, () =>
        new Promise<void>((release) => {
          zone.run(() => {
            inner = source$.pipe(finalize(release)).subscribe(subscriber);
          });
        }),
      )
      .catch((error: unknown) => {
        // AbortError: the caller unsubscribed while still queued — nothing to report.
        if (!abort.signal.aborted) subscriber.error(error);
      });

    return () => {
      abort.abort();
      inner?.unsubscribe();
    };
  });
}
