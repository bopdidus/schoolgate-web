import { ApplicationConfig, importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { authReducer } from './core/auth/store/auth.reducer';
import { AuthEffects } from './core/auth/store/auth.effects';
import { authTokenInterceptor } from './core/interceptors/auth-token.interceptor';
import { tokenRefreshInterceptor } from './core/interceptors/token-refresh.interceptor';
import { httpErrorNotificationInterceptor } from './core/interceptors/http-error-notification.interceptor';
import { initMockSession, mockApiInterceptor } from './core/mock/mock-api.interceptor';
import { environment } from '../environments/environment';
import { provideApi } from './api';
import { TokenStorage } from './core/auth/token-storage/token-storage.interface';
import { InMemoryTokenStorage } from './core/auth/token-storage/in-memory-token-storage.service';
import { LanguageService } from './core/i18n/language.service';

export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

function initLanguage(languageService: LanguageService): () => void {
  return () => languageService.init();
}

function initApp(): () => void {
  return () => {
    if (environment.useMockApi) {
      initMockSession();
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    // Order matters: each interceptor only sees what the ones listed before it let
    // through. mockApiInterceptor (when enabled) short-circuits before any of the real
    // auth/error handling runs. authTokenInterceptor stamps the request first; the retried
    // request from tokenRefreshInterceptor re-stamps it manually since it re-enters the
    // chain below that point. httpErrorNotificationInterceptor sits between them so it
    // only reports errors that survived a refresh attempt (401 is handled upstream of it).
    provideHttpClient(
      withInterceptors([
        ...(environment.useMockApi ? [mockApiInterceptor] : []),
        authTokenInterceptor,
        httpErrorNotificationInterceptor,
        tokenRefreshInterceptor,
      ]),
    ),
    // `withCredentials: true` makes the browser attach the HttpOnly refresh-token
    // cookie on every request to the API (and accept the `Set-Cookie` the backend
    // sends back on login/refresh) — required now that the refresh token is never
    // read or stored by this app's JavaScript.
    provideApi({ basePath: environment.apiBaseUrl, withCredentials: true }),
    provideStore({ auth: authReducer }),
    provideEffects([AuthEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: false }),
    { provide: TokenStorage, useClass: InMemoryTokenStorage },
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient],
        },
      }),
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: initApp,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initLanguage,
      deps: [LanguageService],
      multi: true,
    },
  ],
};
