import { EnvironmentProviders, Provider, importProvidersFrom } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';

import { authReducer } from '../app/core/store/auth.reducer';
import { TokenStorage } from '../app/core/services/token-storage';
import { InMemoryTokenStorage } from '../app/core/services/in-memory-token-storage.service';

/**
 * Providers every component spec needs: router, HTTP (backed by the testing
 * backend, so nothing leaves the browser), store, translations and animations.
 */
export function provideTestDefaults(): (Provider | EnvironmentProviders)[] {
  return [
    provideRouter([]),
    provideHttpClient(),
    provideHttpClientTesting(),
    provideNoopAnimations(),
    provideStore({ auth: authReducer }),
    importProvidersFrom(TranslateModule.forRoot()),
    { provide: TokenStorage, useClass: InMemoryTokenStorage },
  ];
}
