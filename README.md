# Fitness Web

Aplicación web para gestionar rutinas de gimnasio y registrar entrenamientos. Es el frontend de **Fitness App** y un proyecto de aprendizaje de Angular moderno: signals, componentes standalone, detección de cambios sin Zone.js (zoneless), carga diferida (lazy loading) y la nueva sintaxis de control de flujo (`@if`, `@for`, `@switch`).

## Funcionalidades

- **Inicio (dashboard)**: la rutina de hoy, con su lista de ejercicios, y un resumen de la semana en curso:
  - sesiones hechas sobre las planificadas, series y volumen total (Σ kg × repeticiones);
  - una tira de lunes a domingo con los días entrenados, no entrenados, de hoy, planificados y de descanso;
  - la última sesión registrada y los días que quedan de la semana.
- **Programas**: listar, crear, editar, activar y eliminar programas de entrenamiento.
- **Rutinas**: un asistente de dos pasos para crear o editar la rutina de un día (datos básicos y luego ejercicios con sus series).
- **Ejercicios**: un catálogo con selector modal, filtro por grupo muscular y paginación.
- **Registrar sesión**: anotar las series realmente hechas (peso, repeticiones, RPE) a partir de la rutina del día.
- **Errores**: un interceptor HTTP los muestra como avisos (toasts).

Toda la interfaz está en español (es-ES).

## Tecnologías

|           |                                                                                |
| --------- | ------------------------------------------------------------------------------ |
| Framework | Angular 22 (standalone, zoneless, signals, `rxResource`)                       |
| Lenguaje  | TypeScript 6.0 (modo `strict`)                                                 |
| Estilos   | Tailwind CSS v4 + DaisyUI v5                                                   |
| Tests     | Vitest + jsdom                                                                 |
| Backend   | [`fitness-api`](../fitness-api), microservicio `workout-service` (Spring Boot) |

## Requisitos

- Node.js ≥ 22.22 o ≥ 24.13 (el proyecto se desarrolla con Node 26)
- El backend `workout-service` arrancado en `http://localhost:8080`. La URL base está en [src/environments/environment.ts](src/environments/environment.ts).

## Puesta en marcha

```bash
npm install
npm start          # = ng serve → http://localhost:4200 (se recarga sola)
```

## Comandos

| Comando                                         | Qué hace                                                           |
| ----------------------------------------------- | ------------------------------------------------------------------ |
| `ng serve`                                      | Servidor de desarrollo en `http://localhost:4200`                  |
| `ng build`                                      | Build de producción en `dist/fitness-web/`                         |
| `ng build --watch --configuration development`  | Build de desarrollo que se regenera al guardar (`npm run watch`)   |
| `ng test`                                       | Tests con Vitest (`ng test --watch=false` para una sola ejecución) |
| `ng g c features/<feature>/<componente> --flat` | Generar un componente                                              |
| `ng g s core/services/<servicio>`               | Generar un servicio (`@Service()`)                                 |

## Estructura

```
src/app/
├── core/
│   ├── interceptors/    # errorInterceptor → muestra los errores HTTP como toast
│   └── services/        # Servicios singleton (programas, rutinas, ejercicios, sesiones, toasts…)
├── features/            # Una carpeta por funcionalidad; las páginas se cargan con lazy loading
│   ├── dashboard/       # Inicio: tarjeta de hoy, resumen semanal, última sesión, próximos días
│   ├── exercise/        # Selector y listado de ejercicios
│   ├── program/         # Listado de programas
│   ├── routine/         # Asistente de creación de rutinas (paso 1 y 2)
│   └── workout-session/ # Registrar una sesión (/workout-sessions/new?routineId=X)
├── shared/
│   ├── components/      # navbar, confirm-dialog, pagination, toast-response
│   ├── interfaces/      # DTOs que reflejan las respuestas del backend
│   ├── pipes/           # dayLabel, muscleGroupLabel, volume
│   └── utils/           # Listas { label, value } de enums y utilidades de fechas
├── app.config.ts        # Providers: zoneless, LOCALE_ID es-ES, router, HttpClient + interceptores
└── app.routes.ts        # Rutas raíz: un prefijo de URL por funcionalidad
```

### Rutas

| URL                                                  | Pantalla                                           |
| ---------------------------------------------------- | -------------------------------------------------- |
| `/`                                                  | Inicio (dashboard)                                 |
| `/programs`                                          | Programas                                          |
| `/routines/create/step-1`, `/routines/create/step-2` | Asistente de rutinas                               |
| `/workout-sessions/new?routineId=X`                  | Registrar sesión (a pantalla completa, sin navbar) |

## Convenciones

Las convenciones del proyecto están en [CLAUDE.md](CLAUDE.md). Las principales:

- Estado con **signals** (`signal`, `computed`, `linkedSignal`, `input`, `model`); nada de NgRx ni BehaviorSubject.
- **Peticiones**: `rxResource` para las GET que se pintan en pantalla y `.subscribe()` para las POST, PUT y DELETE.
- **Change detection**: `ChangeDetectionStrategy.OnPush` en todos los componentes, y sin Zone.js.
- **Textos**: la interfaz y los comentarios del código en español; los identificadores, en inglés.
- **Enums del backend** (`MONDAY`, `CHEST`…): no se traducen; se muestran con un par `{ label, value }`.

## Notas de aprendizaje

En [notes/](notes/) hay apuntes en español sobre los conceptos de Angular que usa el proyecto: signals, `rxResource`, interceptores, formularios reactivos, modales, zoneless… [notes/angular-22-novedades.md](notes/angular-22-novedades.md) resume lo que cambió de Angular 19 a 22.
