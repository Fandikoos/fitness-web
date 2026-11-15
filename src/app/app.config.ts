import { ApplicationConfig, LOCALE_ID, provideZonelessChangeDetection } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { provideRouter, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { errorInterceptor } from './core/interceptors/error.interceptor';

// Carga los formatos de fecha/número en español para que el DatePipe muestre "jueves, 12 de noviembre"
registerLocaleData(localeEs, 'es-ES');

export const appConfig: ApplicationConfig = {
  providers: [
    // App sin Zone.js: Angular repinta cuando cambia una signal o hay un evento en el template.
    // En Angular 21+ es el comportamiento por defecto si no hay provideZoneChangeDetection(),
    // pero lo dejamos explícito para que se vea la intención.
    provideZonelessChangeDetection(),
    { provide: LOCALE_ID, useValue: 'es-ES' },
    provideRouter(routes, withViewTransitions()),
    // Aquí se registran los interceptores.
    provideHttpClient(
      withInterceptors([errorInterceptor])
    ),
  ]
};
