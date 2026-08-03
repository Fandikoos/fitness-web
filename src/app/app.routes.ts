import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadChildren: () => import('./features/routine/routine.routes'),
    },
    {
        path: '**',
        redirectTo: '',
        pathMatch: 'full',
    }
];
