import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter, switchMap, take } from 'rxjs';
import { selectInitialized, selectUser } from '../store/auth.reducer';

const CHANNEL_NAME = 'schoolgate-session';

type SessionMessage = { type: 'login'; userId: string } | { type: 'logout' };

/**
 * Keeps every tab of this browser on the same account.
 *
 * The refresh-token cookie is shared by all tabs while each tab keeps its own
 * in-memory access token. Without this sync, logging in as Y in one tab would
 * leave another tab working as X until its access token expires, then silently
 * turn it into Y on the next refresh (and a logout would leave the other tabs
 * signed in). Other tabs now follow the change with a full page load, which also
 * drops any data of the previous account still held in the store.
 */
@Injectable({ providedIn: 'root' })
export class SessionSyncService implements OnDestroy {
  private readonly store = inject(Store);
  private readonly channel =
    typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;

  constructor() {
    const zone = inject(NgZone);
    // Every outcome is a full page load, so no change detection is needed here.
    zone.runOutsideAngular(() => {
      this.channel?.addEventListener('message', (event: MessageEvent<SessionMessage>) =>
        this.onMessage(event.data),
      );
    });
  }

  /** Tell the other tabs this browser is now signed in as `userId`. */
  notifyLogin(userId: string): void {
    this.post({ type: 'login', userId });
  }

  /** Tell the other tabs the session was ended. */
  notifyLogout(): void {
    this.post({ type: 'logout' });
  }

  ngOnDestroy(): void {
    this.channel?.close();
  }

  private post(message: SessionMessage): void {
    this.channel?.postMessage(message);
  }

  private onMessage(message: SessionMessage): void {
    if (message.type === 'logout') {
      window.location.assign('/login');
      return;
    }
    // Wait for this tab's own session bootstrap, so a tab still loading a deep
    // link isn't mistaken for a signed-out one.
    this.store
      .select(selectInitialized)
      .pipe(
        filter(Boolean),
        take(1),
        switchMap(() => this.store.select(selectUser).pipe(take(1))),
      )
      .subscribe((user) => {
        // Guest tabs (home, register form) and the same account signed in again
        // elsewhere are left alone; only a tab bound to another account follows.
        if (!user || user.id === message.userId) return;
        window.location.assign('/dashboard');
      });
  }
}
