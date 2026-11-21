import { ApplicationConfig, LOCALE_ID, provideZonelessChangeDetection } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';

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
    // withComponentInputBinding: los params, query params y data de la ruta
    // llegan a los input() del componente que tengan el mismo nombre.
    provideRouter(routes, withViewTransitions(), withComponentInputBinding()),
    // Aquí se registran los interceptores.
    provideHttpClient(
      withInterceptors([errorInterceptor])
    ),
  ]
};
