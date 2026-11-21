import { Routes } from '@angular/router';

// Rutas hijas de /workout-sessions (el prefijo se define en app.routes.ts)
export default [
    {
        // /workout-sessions/new?routineId=X
        path: 'new',
        // Pantalla a pantalla completa: AppComponent oculta el navbar
        data: { hideNavbar: true },
        loadComponent: () => import('./log-session/log-session.component').then((m) => m.LogSessionComponent),
    },
] satisfies Routes;
