import { Routes } from '@angular/router';

// Cada prefijo de URL apunta a una feature; las páginas concretas
// se declaran en el <feature>.routes.ts de cada una.
export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    },
    {
        path: 'programs',
        loadChildren: () => import('./features/program/program.routes'),
    },
    {
        path: 'routines',
        loadChildren: () => import('./features/routine/routine.routes'),
    },
    {
        path: 'workout-sessions',
        loadChildren: () => import('./features/workout-session/workout-session.routes'),
    },
    {
        // Cualquier URL desconocida vuelve al inicio
        path: '**',
        redirectTo: '',
    }
];
