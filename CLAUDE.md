# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fitness-web is a gym workout routine management app built with Angular 19 as a learning project. The goal is to practice modern Angular patterns: signals, standalone components, OnPush change detection, lazy loading, pipes, and the new control flow syntax (`@if`, `@for`, `@switch`).

## Commands

- **Dev server:** `ng serve` (http://localhost:4200, auto-reloads)
- **Build:** `ng build` (production by default, output in `dist/fitness-web/`)
- **Tests:** `ng test` (Karma + Jasmine)
- **Generate component:** `ng g c features/<feature>/<component-name> --flat` (creates standalone by default in Angular 19)
- **Generate service:** `ng g s core/services/<service-name>`

## Architecture

```
src/app/
├── core/              # Singleton services, guards, interceptors
│   └── services/      # Injectable services (RoutineService, ExerciseService)
├── features/          # Feature modules, each lazy-loaded via routes
│   └── routine/       # Routine feature (dashboard, future CRUD pages)
│       ├── routine.routes.ts        # Child routes (default array export)
│       └── dashboard-routine/       # Dashboard component
└── app.routes.ts      # Root routes — lazy-loads feature route files
```

**Routing pattern:** Root routes in `app.routes.ts` use `loadChildren` pointing to feature route files that `export default` a `Routes` array. Feature routes use `loadComponent` for each page.

**State management:** Use Angular signals for component and service state — no NgRx or external state library. Services in `core/services/` are `providedIn: 'root'` singletons.

**HTTP:** `provideHttpClient(withFetch())` is configured in `app.config.ts`. Interceptors will be registered via `withInterceptors()` when needed.

## Styling

- **Tailwind CSS v4** with PostCSS integration (`.postcssrc.json`)
- **DaisyUI v5** as Tailwind plugin — use DaisyUI component classes (`btn`, `card`, `modal`, `input`, `navbar`, `drawer`, etc.) as the primary UI kit
- Global styles in `src/styles.css`: `@import "tailwindcss"` + `@plugin "daisyui"`
- Components use DaisyUI's theming system; prefer DaisyUI semantic classes over raw Tailwind when a matching component exists

## Angular 19 Conventions

- All components are **standalone** (no NgModules)
- Use **`ChangeDetectionStrategy.OnPush`** on every component
- Use **signals** (`signal()`, `computed()`, `effect()`) for reactive state — not BehaviorSubject
- Use the **new template control flow**: `@if`, `@for` (with `track`), `@switch` — not `*ngIf`/`*ngFor`
- Use **`input()`/`output()`** signal-based APIs for component I/O instead of `@Input()`/`@Output()` decorators
- Templates use separate `.html` files (not inline)
- Component selectors use `app-` prefix
- Use inject instead of constructors

## Language

- All UI text (labels, placeholders, messages, buttons) must be in **English**

## TypeScript

- Strict mode enabled (`strict: true`, `strictTemplates: true`)
- Target: ES2022, module resolution: bundler
