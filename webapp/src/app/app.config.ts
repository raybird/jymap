import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { timeMapReducer } from './core/state/time-map.reducer';
import { TimeMapEffects } from './core/state/time-map.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimations(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideStore({
      timeMap: timeMapReducer
    }),
    provideEffects([TimeMapEffects]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: false
    })
  ]
};
