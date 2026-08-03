export default [
    {
        path: '',
        loadComponent: () => import('./dashboard/dashboard-routine.component').then((m) => m.DashboardRoutineComponent),
    },
    {
        path: 'routines',
        loadComponent: () => import('../program/list-programs/list-programs.component').then((m) => m.ListRoutineComponent),
    },
    {
        path: 'create/step-1',
        loadComponent: () => import('./create/step-1-routine/step-1-routine.component').then((m) => m.Step1RoutineComponent),
    },
    {
        path: 'create/step-2',
        loadComponent: () => import('./create/step-2-routine/step-2-routine.component').then((m) => m.Step2RoutineComponent),
    },
]
