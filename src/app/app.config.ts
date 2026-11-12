import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { provideRouter, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { errorInterceptor } from './core/interceptors/error.interceptor';

// Loads Spanish date/number formats so the DatePipe shows "jueves, 12 de noviembre"
registerLocaleData(localeEs, 'es-ES');

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: LOCALE_ID, useValue: 'es-ES' },
    provideRouter(routes, withViewTransitions()),
    // Aquí se registran los interceptores
    provideHttpClient(
      withFetch(),
      withInterceptors([errorInterceptor])
    ),
  ]
};
