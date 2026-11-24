# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fitness-web is a gym workout routine management app built with Angular 22 as a learning project. The goal is to practice modern Angular patterns: signals, standalone components, OnPush change detection, lazy loading, pipes, and the new control flow syntax (`@if`, `@for`, `@switch`).

## Commands

- **Dev server:** `ng serve` (http://localhost:4200, auto-reloads)
- **Build:** `ng build` (production by default, output in `dist/fitness-web/`)
- **Tests:** `ng test` (Vitest + jsdom; `ng test --watch=false` for a single run)
- **Generate component:** `ng g c features/<feature>/<component-name> --flat` (standalone by default; `angular.json` schematics keep the `.component.ts` suffix)
- **Generate service:** `ng g s core/services/<service-name>` (Angular 22 generates `@Service()` by default, which matches the existing services)

## Architecture

```
src/app/
├── core/
│   ├── interceptors/   # Functional HTTP interceptors (errorInterceptor → toast)
│   └── services/       # Root singletons: Routine/Exercise/Program/Toast services, CreateRoutineStateService
├── features/           # One folder per feature; pages are lazy-loaded with loadComponent
│   ├── dashboard/      # Home: today card, week stats/strip, last session, coming up (week-summary.ts = pure calcs)
│   ├── exercise/       # list-exercises (modal picker), select-exercises
│   ├── program/        # list-programs
│   ├── workout-session/ # log-session (/workout-sessions/new?routineId=X)
│   └── routine/
│       ├── routine.routes.ts   # Child routes of /routines (default array export)
│       └── create/             # 2-step routine creation wizard (step-1, step-2)
├── shared/
│   ├── components/     # confirm-dialog, navbar, pagination, toast-response
│   ├── interfaces/     # DTOs mirroring the backend (ErrorResponse, PageResponse…)
│   ├── pipes/          # dayLabel, muscleGroupLabel (enum → Spanish label), volume (kg → "9,6 t")
│   └── utils/          # { label, value } lists for backend enums; dates.ts (LocalDate ↔ Date without TZ shifts, ISO week)
├── app.config.ts       # Providers: zoneless CD, LOCALE_ID es-ES, router, HttpClient + interceptors
└── app.routes.ts       # Root routes — one URL prefix per feature (loadChildren)
```

**Routing pattern:** Root routes in `app.routes.ts` map a URL prefix to a feature with `loadChildren`; each feature has its own `<feature>.routes.ts` that `export default`s a `Routes` array, and each page uses `loadComponent`. `''` → dashboard (single page, `loadComponent` directly); `programs` → `program.routes.ts`; `routines` → `routine.routes.ts` (wizard at `/routines/create/step-1|2`); `workout-sessions` → `workout-session.routes.ts`. New features add their own prefix in `app.routes.ts`. `withComponentInputBinding()` is enabled, so route/query params arrive as `input()`s (use `transform: numberAttribute` for ids).

**State management:** Use Angular signals for component and service state — no NgRx or external state library. Services in `core/services/` are root singletons declared with **`@Service()`** (Angular 22, equivalent to `@Injectable({ providedIn: 'root' })`). `@Service()` requires `inject()` — no constructor injection.

**Data loading:** Use `rxResource({ params, stream })` (from `@angular/core/rxjs-interop`) for GET requests shown in templates; use a manual `.subscribe()` for POST/PUT/DELETE actions. Always check `hasValue()` (or handle the `error()` branch first) before reading `.value()` — it throws when the resource is in the error state. See `notes/rxresource-pattern.md`.

**HTTP:** `provideHttpClient(withInterceptors([errorInterceptor]))` in `app.config.ts`. Fetch is the default backend in Angular 22, so don't add `withFetch()` (deprecated). `provideHttpClient()` is still required to register interceptors. Errors are shown by `errorInterceptor` as toasts, so components only handle success.

**Change detection:** The app is **zoneless** (`provideZonelessChangeDetection()`; `zone.js` is not installed and there are no polyfills). Angular only re-renders when a signal read by a template changes or a template event fires, so:
- All state shown in templates must be signals (`signal`, `computed`, `input`, `model`, `rxResource`…), never plain mutable fields.
- Inside `setTimeout`/`setInterval`/Promises/`subscribe`, update signals, not plain properties.
- Don't add `zone.js` back, use `NgZone`, or add libraries that depend on Zone.js.

## Styling

- **Tailwind CSS v4** with PostCSS integration (`.postcssrc.json`)
- **DaisyUI v5** as Tailwind plugin — use DaisyUI component classes (`btn`, `card`, `modal`, `input`, `navbar`, `drawer`, etc.) as the primary UI kit
- Global styles in `src/styles.css`: `@import "tailwindcss"` + `@plugin "daisyui"`
- Components use DaisyUI's theming system; prefer DaisyUI semantic classes over raw Tailwind when a matching component exists

### Visual direction

The owner likes the current look; design work (including the `frontend-design` skill) must improve it, not replace it:
- **Colors:** keep DaisyUI's default light/dark themes and its semantic colors (`primary`, `success`, `base-100`…). Don't add custom themes, palettes or hex colors.
- **Typography:** one family, **Archivo** (variable, loaded in `index.html`). Body text at normal width; headings (`h1`–`h3`, `.card-title`) slightly wider via `font-stretch` in `styles.css`. Don't add other fonts.
- **Layout:** keep the DaisyUI card-based layout. Improvements should target hierarchy, spacing, copy and states (loading, empty, error), not the overall identity.
- A full redesign (custom theme, display font, removing cards) was tried on 2026-11-24 and rejected: don't propose it again unless asked.

## Angular 22 Conventions

- All components are **standalone** (no NgModules)
- Write **`changeDetection: ChangeDetectionStrategy.OnPush`** explicitly on every component (it is the default since Angular 22, but we keep it for clarity). Never use `Eager` (formerly `Default`)
- Use **signals** (`signal()`, `computed()`, `linkedSignal()`, `effect()`) for reactive state — not BehaviorSubject. Prefer `computed`/`linkedSignal` over writing signals inside an `effect`; never use the deprecated `allowSignalWrites` option
- Use the **new template control flow**: `@if`, `@for` (with `track`), `@switch` — `*ngIf`/`*ngFor`/`*ngSwitch` are deprecated
- Use `[class.x]` / `[class]` bindings instead of `NgClass`/`NgStyle`
- Use **`input()`/`output()`/`model()`** signal-based APIs for component I/O instead of `@Input()`/`@Output()` decorators
- Use `viewChild()` instead of `@ViewChild()`
- Reactive Forms (`FormBuilder.nonNullable`) are the forms approach in this project; Signal Forms are stable in Angular 22 but not adopted
- Templates use separate `.html` files (not inline)
- Component selectors use `app-` prefix
- File names keep the type suffix (`foo.component.ts`, `foo.service.ts`) — enforced by the `schematics` block in `angular.json`
- Use inject instead of constructors
- Never import from `node_modules/...` paths (e.g. auto-imports of internal `.d-XXXX` chunks); always import from the public package (`@angular/common`, etc.)

## Language

- All UI text (labels, placeholders, messages, buttons, aria-labels, tooltips) must be in **Spanish (Spain)** — e.g. "serie", "repeticiones", "Inténtalo de nuevo"
- Code identifiers (variables, functions, classes) and console logs stay in English
- Code comments (TS, HTML, CSS) are written in **Spanish** so they're easier to follow
- Backend enums (e.g. `MONDAY`, `CHEST`) are never translated: keep a `{ label, value }` pair and show only the `label` (see `shared/utils/` and the `muscleGroupLabel` pipe)
- The app uses the `es-ES` locale (`LOCALE_ID` in `app.config.ts`), so `DatePipe` outputs Spanish dates
- An English translation may be added in the future (Angular i18n)

## TypeScript

- TypeScript 6.0 (required by Angular 22); Node ≥ 22.22 / 24.13 (the project runs on Node 26)
- Strict mode enabled (`strict: true`, `strictTemplates: true`)
- Target: ES2022, module resolution: bundler
- `tsconfig.app.json` suppresses the `nullishCoalescingNotNullable` and `optionalChainNotNullable` extended diagnostics (added by the v22 migration for the `?.` semantics change; can be re-enabled)

## Learning notes

`notes/` holds Spanish learning notes (signals, rxResource, interceptors, forms, modals…), updated to Angular 22. `notes/angular-22-novedades.md` summarises what changed from Angular 19 to 22 and lists optional pending tasks. When an Angular concept used in the code changes, keep the matching note in sync.
