import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-layout">
      <router-outlet />
    </div>
  `,
  styles: `
    .auth-layout {
      box-sizing: border-box;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background-color: var(--color-background);
      overflow-y: auto;
    }
  `,
})
export class AuthLayoutComponent {}
