import { Routes } from '@angular/router';

// Rutas hijas de /workout-sessions (el prefijo se define en app.routes.ts)
export default [
    {
        // /workout-sessions → historial de sesiones por semana
        path: '',
        loadComponent: () =>
            import('./history-workout-sessions/history-workout-sessions.component').then(
                (m) => m.HistoryWorkoutSessionsComponent,
            ),
    },
    {
        // /workout-sessions/new?routineId=X
        path: 'new',
        // Pantalla a pantalla completa: AppComponent oculta el navbar
        data: { hideNavbar: true },
        loadComponent: () => import('./log-session/log-session.component').then((m) => m.LogSessionComponent),
    },
    {
        // /workout-sessions/:id → detalle de una sesión.
        // Va DESPUÉS de 'new': el router prueba las rutas en orden y si no "new" se tomaría como un id
        path: ':id',
        loadComponent: () =>
            import('./workout-session-detail/workout-session-detail.component').then(
                (m) => m.WorkoutSessionDetailComponent,
            ),
    },
] satisfies Routes;
