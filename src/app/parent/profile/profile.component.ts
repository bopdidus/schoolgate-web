import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { selectUser } from '../../core/store/auth.reducer';
import { AuthActions } from '../../core/store/auth.actions';
import { LanguageService } from '../../core/services/language.service';
import { ThemeService } from '../../core/services/theme.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogResult,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';

/** The account, language and theme, shortcuts, sign-out (mobile profile tab). */
@Component({
  selector: 'app-parent-profile',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    TranslateModule,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  private readonly store = inject(Store);
  private readonly dialog = inject(MatDialog);
  readonly language = inject(LanguageService);
  readonly theme = inject(ThemeService);

  readonly user$ = this.store.select(selectUser);

  get lang(): string {
    return this.language.getCurrentLanguage();
  }

  logout(): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { title: 'NAV.LOGOUT', message: 'PARENT.LOGOUT_CONFIRM', confirmLabel: 'NAV.LOGOUT' },
        width: '400px',
      })
      .afterClosed()
      .subscribe((result: ConfirmDialogResult | undefined) => {
        if (result?.confirmed) this.store.dispatch(AuthActions.logout());
      });
  }
}
