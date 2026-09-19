import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TokenExpiryService } from './core/services/token-expiry.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  /**
   * Merely injecting this root-scoped service instantiates it (and its
   * constructor starts watching the access token) for the lifetime of the app,
   * so proactive refresh scheduling is active from the very first load.
   */
  private readonly tokenExpiry = inject(TokenExpiryService);
}
