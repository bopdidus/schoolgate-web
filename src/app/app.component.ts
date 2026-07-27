import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TokenExpiryService } from './core/auth/application/token-expiry.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<router-outlet />`,
})
export class AppComponent {
  /**
   * Merely injecting this root-scoped service instantiates it (and its
   * constructor starts watching the access token) for the lifetime of the app,
   * so proactive refresh scheduling is active from the very first load.
   */
  private readonly tokenExpiry = inject(TokenExpiryService);
}
