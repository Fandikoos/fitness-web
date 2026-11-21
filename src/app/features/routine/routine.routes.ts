import { Routes } from '@angular/router';

// Rutas hijas de /routines (el prefijo se define en app.routes.ts)
export default [
    {
        // /routines/create/step-1
        path: 'create/step-1',
        loadComponent: () => import('./create/step-1-routine/step-1-routine.component').then((m) => m.Step1RoutineComponent),
    },
    {
        // /routines/create/step-2
        path: 'create/step-2',
        loadComponent: () => import('./create/step-2-routine/step-2-routine.component').then((m) => m.Step2RoutineComponent),
    },
] satisfies Routes;
