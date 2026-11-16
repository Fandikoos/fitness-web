import { Routes } from '@angular/router';

// Rutas hijas de /programs (el prefijo se define en app.routes.ts)
export default [
    {
        // /programs
        path: '',
        loadComponent: () => import('./list-programs/list-programs.component').then((m) => m.ListProgramComponent),
    },
] satisfies Routes;
