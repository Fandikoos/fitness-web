# Fitness Web

[![CI - Build and Test](https://github.com/Fandikoos/fitness-web/actions/workflows/ci.yml/badge.svg)](https://github.com/Fandikoos/fitness-web/actions/workflows/ci.yml)

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.

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

## Flujo de trabajo

Este repo sigue **GitHub Flow**: `main` siempre está estable y todo cambio entra por Pull Request.

### Ramas
- `main`: protegida. No admite push directo, force push ni borrado.
- Una rama por tarjeta de Trello, creada desde `main` actualizado:

| Prefijo     | Uso                                   | Ejemplo                          |
|-------------|---------------------------------------|----------------------------------|
| `feat/`     | Funcionalidad nueva                   | `feat/historial-sesiones`        |
| `fix/`      | Corrección de un bug                  | `fix/validaciones-series`        |
| `refactor/` | Cambio interno sin cambiar comportamiento | `refactor/routine-service`   |
| `docs/`     | Solo documentación                    | `docs/flujo-de-trabajo`          |
| `chore/`    | Configuración, dependencias, CI       | `chore/ci-backend`               |

### Ciclo de una tarjeta
```bash
git switch main && git pull                # partir de main actualizado
git switch -c fix/validaciones-series      # rama de la tarjeta
# ...commits...
git push -u origin fix/validaciones-series
gh pr create --fill                        # o desde la web de GitHub
```

1. Abre el PR hacia `main` y rellena la plantilla (qué cambia, tarjeta, cómo probarlo).
2. Espera a que pasen los checks de la CI (cuando exista).
3. Fusiona con **Squash and merge**: `main` queda con un commit por tarjeta.
4. GitHub borra la rama remota automáticamente. En local: `git switch main && git pull && git branch -d <rama>`.

### Commits y títulos de PR
En español y con el formato `tipo: descripción` (`feat`, `fix`, `refactor`, `docs`, `chore`, `test`).
El título del PR es el que acaba como commit en `main` al hacer squash, así que cuídalo más que los commits intermedios.

### Actualizaciones de dependencias (Dependabot)
[Dependabot](.github/dependabot.yml) revisa cada semana `npm` y las `github-actions` y abre un PR por actualización. Los paquetes `@angular/*` van en un mismo PR (Angular se actualiza entero), y el resto de versiones menores y parches se juntan en otro.

| Tipo de cambio | Ejemplo | Qué hacer |
|----------------|---------|-----------|
| **Parche** | `4.3.3 → 4.3.5` | Si la CI está en verde, se mergea directamente. |
| **Menor** | `22.2 → 22.3` | Si la CI está en verde, se mergea. Si cambia algo visual (DaisyUI, Tailwind), se mira la app con `ng serve` antes. |
| **Mayor** | `Angular 22 → 23` | No se mergea a ciegas. Hay que leer las *release notes* y, si requiere cambios en el código, crear una tarjeta propia en Trello. |

- Los PR de Dependabot se mergean **de uno en uno**: todos tocan `package-lock.json`, y Dependabot hace rebase de los demás él solo después de cada merge.
- No se hacen commits a mano en las ramas de Dependabot, porque deja de gestionarlas. Se le dan órdenes con comentarios en el PR: `@dependabot rebase`, `@dependabot recreate` o `@dependabot ignore this major version`.
- En las actions (`actions/checkout`, `actions/setup-node`…), una versión mayor con la CI en verde suele ser segura, porque el propio workflow ya las está usando.

## Notas de aprendizaje

En [notes/](notes/) hay apuntes en español sobre los conceptos de Angular que usa el proyecto: signals, `rxResource`, interceptores, formularios reactivos, modales, zoneless… [notes/angular-22-novedades.md](notes/angular-22-novedades.md) resume lo que cambió de Angular 19 a 22.
