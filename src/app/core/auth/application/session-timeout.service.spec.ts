import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Subject, of } from 'rxjs';
import { SessionTimeoutService } from './session-timeout.service';
import { TokenRefreshCoordinator } from './token-refresh-coordinator.service';
import { AuthActions } from '../store/auth.actions';
import { IDLE_TIMEOUT_MS } from '../auth.config';
import { SessionTimeoutDialogResult } from '../../../shared/components/session-timeout-dialog/session-timeout-dialog.component';

describe('SessionTimeoutService', () => {
  let service: SessionTimeoutService;
  let dialog: jasmine.SpyObj<MatDialog>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<unknown, SessionTimeoutDialogResult>>;
  let afterClosed$: Subject<SessionTimeoutDialogResult | undefined>;
  let store: jasmine.SpyObj<Store>;
  let tokenRefresh: jasmine.SpyObj<TokenRefreshCoordinator>;

  beforeEach(() => {
    afterClosed$ = new Subject();
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close', 'afterClosed']);
    dialogRef.afterClosed.and.returnValue(afterClosed$.asObservable());

    dialog = jasmine.createSpyObj('MatDialog', ['open']);
    dialog.open.and.returnValue(dialogRef);

    store = jasmine.createSpyObj('Store', ['dispatch']);
    tokenRefresh = jasmine.createSpyObj('TokenRefreshCoordinator', ['refresh']);

    TestBed.configureTestingModule({
      providers: [
        SessionTimeoutService,
        { provide: MatDialog, useValue: dialog },
        { provide: Store, useValue: store },
        { provide: TokenRefreshCoordinator, useValue: tokenRefresh },
      ],
    });

    service = TestBed.inject(SessionTimeoutService);
  });

  afterEach(() => service.stop());

  it('should open the warning dialog after IDLE_TIMEOUT_MS of inactivity', fakeAsync(() => {
    service.start();

    tick(IDLE_TIMEOUT_MS + 1);

    expect(dialog.open).toHaveBeenCalledTimes(1);
  }));

  it('should reset the idle timer on user activity and not warn prematurely', fakeAsync(() => {
    service.start();
    tick(IDLE_TIMEOUT_MS - 5000);

    window.dispatchEvent(new Event('mousemove'));
    tick(2000); // let the 1s activity throttle window close

    tick(IDLE_TIMEOUT_MS - 7000);
    expect(dialog.open).not.toHaveBeenCalled();

    tick(8000);
    expect(dialog.open).toHaveBeenCalledTimes(1);
  }));

  it('should be idempotent: calling start() twice must not register duplicate listeners', fakeAsync(() => {
    service.start();
    service.start();

    tick(IDLE_TIMEOUT_MS + 1);

    expect(dialog.open).toHaveBeenCalledTimes(1);
  }));

  it('should refresh the session (not log out) when the user chooses to stay signed in', fakeAsync(() => {
    tokenRefresh.refresh.and.returnValue(of({ accessToken: 'new' }));
    service.start();
    // The warning dialog (and its afterClosed subscription) only exists once
    // the idle timeout has elapsed.
    tick(IDLE_TIMEOUT_MS + 1);

    afterClosed$.next('extend');
    tick();

    expect(tokenRefresh.refresh).toHaveBeenCalled();
    expect(store.dispatch).not.toHaveBeenCalledWith(AuthActions.logout());
    service.stop();
  }));

  it('should log the user out when the warning resolves to "logout"', fakeAsync(() => {
    service.start();
    tick(IDLE_TIMEOUT_MS + 1);

    afterClosed$.next('logout');
    tick();

    expect(store.dispatch).toHaveBeenCalledWith(AuthActions.logout());
    service.stop();
  }));

  it('should stop watching and close any open dialog on stop()', fakeAsync(() => {
    service.start();
    tick(IDLE_TIMEOUT_MS + 1);

    service.stop();

    expect(dialogRef.close).toHaveBeenCalled();
  }));
});
