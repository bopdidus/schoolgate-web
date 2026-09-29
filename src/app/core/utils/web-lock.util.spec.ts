import { NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable, Subject, defer, firstValueFrom } from 'rxjs';

import { withWebLock } from './web-lock.util';

describe('withWebLock', () => {
  let zone: NgZone;
  let lockName: string;

  beforeEach(() => {
    zone = TestBed.inject(NgZone);
    // A fresh name per test: a lock left held by a failing test cannot block the next.
    lockName = `test-lock-${Math.random()}`;
  });

  /** A source that records when it is subscribed and completes on demand. */
  function controlledSource(log: string[], label: string) {
    const done = new Subject<string>();
    const source$: Observable<string> = defer(() => {
      log.push(`${label}:start`);
      return done;
    });
    const finish = () => {
      log.push(`${label}:end`);
      done.next(label);
      done.complete();
    };
    return { source$, finish };
  }

  const tick = () => new Promise((resolve) => setTimeout(resolve, 20));

  it('does not start the second source until the first completes', async () => {
    const log: string[] = [];
    const first = controlledSource(log, 'A');
    const second = controlledSource(log, 'B');

    const a = firstValueFrom(withWebLock(lockName, first.source$, zone));
    const b = firstValueFrom(withWebLock(lockName, second.source$, zone));
    await tick();
    expect(log).toEqual(['A:start']);

    first.finish();
    await tick();
    expect(log).toEqual(['A:start', 'A:end', 'B:start']);

    second.finish();
    expect(await a).toBe('A');
    expect(await b).toBe('B');
  });

  it('releases the lock when the holder errors', async () => {
    const failing = new Subject<string>();
    const a = firstValueFrom(withWebLock(lockName, failing, zone));
    const b = firstValueFrom(withWebLock(lockName, defer(() => Promise.resolve('B')), zone));
    await tick();

    failing.error(new Error('refresh failed'));
    await expectAsync(a).toBeRejectedWithError('refresh failed');
    expect(await b).toBe('B');
  });

  it('releases the lock when the holder unsubscribes', async () => {
    const log: string[] = [];
    const first = controlledSource(log, 'A');
    const subscription = withWebLock(lockName, first.source$, zone).subscribe();
    const b = firstValueFrom(withWebLock(lockName, defer(() => Promise.resolve('B')), zone));
    await tick();

    subscription.unsubscribe();
    expect(await b).toBe('B');
  });

  it('delivers results inside the Angular zone', async () => {
    let inZone = false;
    await firstValueFrom(
      withWebLock(lockName, defer(() => {
        inZone = NgZone.isInAngularZone();
        return Promise.resolve(true);
      }), zone),
    );
    expect(inZone).toBeTrue();
  });
});
