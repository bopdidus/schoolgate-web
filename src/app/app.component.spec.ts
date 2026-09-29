import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app.component';
import { TokenExpiryService } from './core/services/token-expiry.service';
import { SessionSyncService } from './core/services/session-sync.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        // The real service starts token watching in its constructor.
        { provide: TokenExpiryService, useValue: {} },
        // The real service opens a BroadcastChannel and needs the store.
        { provide: SessionSyncService, useValue: {} },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
