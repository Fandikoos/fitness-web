# Angular 22 — Qué ha cambiado desde Angular 19

Resumen de lo que trae Angular 22 (y las versiones intermedias 20 y 21) para consultar dudas. Está pensado para este proyecto: primero lo que **nos afecta directamente**, después las novedades por área y al final lo que queda **pendiente** de hacer.

Angular saca una versión mayor cada 6 meses: 20 (mayo 2025), 21 (noviembre 2025), 22 (mayo 2026). Por eso hay que migrar de una en una: `ng update` no permite saltarse versiones.

---

## 1. Lo que cambió en este proyecto con la migración

| | Antes (Angular 19) | Ahora (Angular 22) |
|---|---|---|
| Node | 22.13 | 26 (mínimo para Angular 22: 22.22 / 24.13) |
| TypeScript | 5.7 | **6.0** |
| Paquete de build | `@angular-devkit/build-angular` | **`@angular/build`** (solo esbuild/Vite, sin webpack) |
| Tests | Karma + Jasmine (abre Chrome) | **Vitest + jsdom** (corre en Node) |
| `rxResource` | `request` / `loader` | **`params` / `stream`** |
| Estrategia por defecto | `Default` | **`OnPush`** (`Default` renombrado a `Eager`) |

Cambios de código que hicimos a mano:
- `rxResource({ request, loader })` → `rxResource({ params, stream })` en dashboard, list-programs y list-exercises.
- Un import roto de `NgClass` que apuntaba a un fichero interno de `node_modules` (lo había autoimportado VSCode).
- `AppComponent` → `OnPush` (la migración le había puesto `Eager` para no cambiar su comportamiento).
- Los specs autogenerados que estaban rotos desde antes (faltaba `provideRouter` y dar valor a los inputs obligatorios).

Cambios de configuración que hizo `ng update` y conviene conocer:
- **`angular.json` → `schematics`**: mantiene el sufijo `.component.ts`, `.service.ts`... Desde Angular 20 la guía de estilo oficial genera `foo.ts` (sin sufijo) y clases sin `Component`. Lo mantenemos con sufijo por coherencia con el código existente.
- **`tsconfig.app.json` → `extendedDiagnostics`**: desactiva dos avisos (`nullishCoalescingNotNullable`, `optionalChainNotNullable`) por el cambio de `?.` (ver sección de plantillas). Se pueden volver a activar.

---

## 2. Signals

Lo básico (`signal`, `computed`, `set`, `update`, `input`, `output`) no ha cambiado. Lo que cambia es el **estado** de las APIs:

| API | Angular 19 | Angular 22 |
|---|---|---|
| `signal`, `computed` | Estable | Estable |
| `input`, `output`, `model`, `viewChild` | Estable | Estable |
| `effect` | Developer preview | **Estable** (desde 20) |
| `linkedSignal` | Developer preview | **Estable** (desde 20) |
| `toSignal`, `toObservable` | Developer preview | **Estable** (desde 20) |
| `resource`, `rxResource`, `httpResource` | Experimental | **Estable** (desde 22) |
| `debounced()` | — | Experimental (nuevo en 22) |

Otros cambios:
- **`allowSignalWrites` está deprecado** (desde 19): escribir signals dentro de un `effect` ya está permitido sin la opción. Que esté permitido no significa que sea buena idea → usa `computed` o `linkedSignal` siempre que puedas.
- `afterRender()` se renombró a **`afterEveryRender()`** (Angular 20).
- `effect()` ya no tiene la opción `forceRoot`, y `toSignal()` ya no tiene `rejectErrors`.

Notas relacionadas: [signals-fundamentals.md](signals-fundamentals.md), [signals-computed-vs-effect.md](signals-computed-vs-effect.md), [signals-best-practices.md](signals-best-practices.md).

---

## 3. Resources (rxResource, resource, httpResource)

El cambio que más nos tocó. Detalle completo en [rxresource-pattern.md](rxresource-pattern.md).

```ts
// Angular 19
rxResource({
  request: () => ({ page: this.page() }),
  loader: ({ request }) => this.service.get(request.page),
});

// Angular 20+
rxResource({
  params: () => ({ page: this.page() }),
  stream: ({ params }) => this.service.get(params.page),
});
```

- `rxResource`: `request` → `params`, `loader` → `stream`.
- `resource`: `request` → `params`, pero la función se sigue llamando `loader` (devuelve una Promise).
- `httpResource`: la URL tiene que ser una **función** → `httpResource<T>(() => '/api/x')`. Y `map` se renombró a `parse`.
- **`value()` lanza una excepción si el resource está en error.** Protégelo con `hasValue()` (como el `isPresent()` de un `Optional` en Java).
- `status()` devuelve strings: `'idle' | 'loading' | 'reloading' | 'resolved' | 'error' | 'local'` (antes era un enum).
- `reload()` solo existe en resources escribibles (`WritableResource`), que son los que devuelven `resource()` y `rxResource()`.
- Nuevo en 22: `chain()` para encadenar resources y la opción `id` para cachearlos con SSR.

---

## 4. Change detection y Zoneless

Detalle completo en [signals-change-detection-zoneless.md](signals-change-detection-zoneless.md).

- **Angular 22: `OnPush` es la estrategia por defecto.** Un componente sin `changeDetection` ya es OnPush.
- `ChangeDetectionStrategy.Default` → **`ChangeDetectionStrategy.Eager`** (`Default` sigue existiendo como alias deprecado).
- **Zoneless**: estable desde 20.2 y por defecto en apps nuevas desde 21 (`ng new` ya no instala zone.js). El provider es `provideZonelessChangeDetection()`.
- **Este proyecto ya es zoneless**: `provideZonelessChangeDetection()` en `app.config.ts`, sin `zone.js` en los polyfills y sin el paquete instalado. Los pasos y las reglas para mantenerlo así están en la nota de zoneless.

Analogía Java: OnPush por defecto es como si Java pasara a hacer los campos `final` por defecto. Lo que antes era una buena práctica que tenías que acordarte de aplicar, ahora es lo normal, y lo contrario (`Eager`) hay que pedirlo explícitamente.

---

## 5. Plantillas

### Control flow
- `*ngIf`, `*ngFor` y `*ngSwitch` están **deprecados** desde Angular 20 → `@if`, `@for`, `@switch` (este proyecto ya los usa).
- Se recomienda `[class.x]` / `[class]` y `[style.x]` en vez de `NgClass` / `NgStyle` (Angular 21). Hay migraciones automáticas: `ng g @angular/core:ngclass-to-class-migration`.

### Nuevos operadores en expresiones
```html
<!-- Angular 20 -->
{{ 2 ** 3 }}                                   <!-- potencia → 8 -->
@if ('admin' in permissions) { ... }           <!-- operador in -->
<button (click)="void save()">                 <!-- void: ignora el valor devuelto -->
{{ `Serie ${n} de ${total}` }}                 <!-- template literals -->

<!-- Angular 21 -->
@if (/^\d+$/.test(code())) { ... }             <!-- expresiones regulares -->

<!-- Angular 22 -->
<div /* comentario dentro de la etiqueta */ class="card">
```

- Mezclar `??` con `&&` o `||` sin paréntesis da aviso (Angular 20): escribe `(a ?? b) || c`.

### Cambio en `?.` (Angular 22)
Antes, en las plantillas, `program?.name` devolvía **`null`** si `program` era null. Ahora devuelve **`undefined`**, igual que en TypeScript normal. Además, dentro de un `@if (program?.author)` el compilador ya sabe que `program` no es null.

Para no romper nada, la migración envuelve las expresiones afectadas en `$safeNavigationMigration(...)`. En este proyecto **no tocó ninguna**. Solo desactivó los dos avisos del `tsconfig.app.json` que comentaba arriba.

Solo importa si comparas explícitamente con `=== null`. Con `@if`, `??` o `!` da igual que sea `null` o `undefined`.

### `@defer`
- `@defer (on idle(500ms))`: timeout para el trigger `idle` (Angular 22).
- `@defer (on viewport({ rootMargin: '50px' }))`: opciones del IntersectionObserver (Angular 21).

### Compilador más estricto
- `strictTemplates` está activado por defecto en Angular 22 (nosotros ya lo teníamos).
- Error al leer un `input.required()` antes de que tenga valor, por ejemplo en el constructor (Angular 21).
- NG8023: dos componentes que coinciden con el mismo elemento. NG1054: un input enlazado dos veces (Angular 22). Antes estos errores salían en tiempo de ejecución; ahora salen al compilar.

---

## 6. Inyección de dependencias: `@Service()`

Nuevo en Angular 22:

```ts
import { Service } from '@angular/core';

// Equivale a @Injectable({ providedIn: 'root' })
@Service()
export class ToastService {
  private http = inject(HttpClient);   // obliga a usar inject(), no constructor
}
```

- **`ng g s` genera `@Service()` por defecto.** Para generar el estilo antiguo: `ng g s core/services/foo --injectable`.
- **En este proyecto ya migramos los 5 servicios de `core/services/` a `@Service()`** a mano, porque no hay migración automática. Fue directo porque ninguno usaba constructor. Si un servicio inyectara cosas por constructor, primero habría que pasarlo a `inject()`.
- Para interceptores, pipes y componentes no cambia nada: `@Service()` es solo para servicios.
- `@Service({ autoProvided: false })` crea un servicio que no está en root y que tienes que poner en un `providers` (como un `@Injectable()` sin `providedIn`).
- `injectAsync(() => import('./report.service').then(m => m.ReportService))` carga un servicio con lazy loading, solo cuando se necesita.

Analogía Java: `@Service()` es literalmente el `@Service` de Spring. Una anotación que dice "esto es un singleton gestionado por el contenedor".

---

## 7. HTTP

- **Angular 21:** `HttpClient` está disponible por defecto, sin `provideHttpClient()`. Pero **para registrar interceptores sigue haciendo falta** `provideHttpClient(withInterceptors([...]))`.
- **Angular 22:** **Fetch es el backend por defecto** y `withFetch()` está **deprecado**. Si necesitas el antiguo `XMLHttpRequest` (por ejemplo, para ver el progreso al subir ficheros), existe `withXhr()`.
- `reportProgress` está deprecado → `reportUploadProgress` / `reportDownloadProgress`.

Detalle en [http-interceptors.md](http-interceptors.md).

---

## 8. Formularios: Signal Forms

- **Angular 21:** experimental. **Angular 22:** **estable**.
- Paquete: `@angular/forms/signals`. El modelo es una `signal()`, las validaciones se declaran con funciones (`required`, `minLength`, `email`, `min`, `max`, `pattern`, `minDate`, `maxDate`, `validate`, `validateAsync`, `validateHttp`...) y en la plantilla se usa `[formField]`.
- Las **reactive forms siguen siendo válidas** y no están deprecadas. No hace falta migrar los formularios del proyecto.

Ejemplo comparado con reactive forms en [reactive-forms.md](reactive-forms.md).

---

## 9. Router

- `canMatch` recibe un tercer argumento obligatorio (`currentSnapshot`). La migración lo añade sola; nosotros no tenemos guards.
- **`paramsInheritanceStrategy` pasa a ser `'always'` por defecto** (Angular 22): las rutas hijas heredan los parámetros de las rutas padre. Si algún día una ruta hija lee un parámetro que no esperabas, es por esto. Para volver al comportamiento anterior: `withRouterConfig({ paramsInheritanceStrategy: 'emptyOnly' })`.
- `withComponentInputBinding()` acepta opciones (`queryParams`, `unmatchedInputBehavior`).
- `redirectTo` puede ser asíncrono (Angular 20).

---

## 10. Tests y herramientas

- **Vitest** es el runner por defecto desde Angular 21 (builder `@angular/build:unit-test`). Karma sigue existiendo, pero está en desuso.
- Lo que cambia al escribir tests con Vitest (si algún día escribes alguno):

| Jasmine | Vitest |
|---|---|
| `spyOn(obj, 'metodo')` | `vi.spyOn(obj, 'metodo')` |
| `jasmine.createSpy()` | `vi.fn()` |
| `.and.returnValue(x)` | `.mockReturnValue(x)` |
| `fakeAsync` + `tick()` | `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync()` |

- `TestBed.flushEffects()` → **`TestBed.tick()`** (Angular 20). `TestBed.get()` eliminado → `TestBed.inject()`.
- En tests de componentes zoneless se usa `await fixture.whenStable()` en vez de `fixture.detectChanges()`.
- `PORT=4300 ng serve` cambia el puerto del servidor de desarrollo (Angular 22).
- Angular trae un **servidor MCP** (`ng mcp`) para que asistentes de IA consulten la documentación y las buenas prácticas de tu versión.

---

## 11. Limpieza tras la migración

### Hecho
- **Lecturas de `value()` protegidas con `hasValue()`**. Era un bug latente: si el backend fallaba, `value()` lanzaba una excepción.
  - `list-exercises`: los `computed` (`exercises`, `totalPages`, `totalElements`) leen de un `page` protegido. Antes, la paginación leía `totalPages()` fuera de la rama que comprueba el error.
  - `list-programs`: nuevo `programList` protegido y **nueva rama de error con botón "Reintentar"** (antes no había rama de error).
  - `dashboard`: `activeProgram` protegido también, por coherencia (el template ya comprobaba el error antes).
- **Quitado `withFetch()`** de `app.config.ts`.
- **Desinstalado `@angular/platform-browser-dynamic`**, que estaba deprecado y no se usaba.
- **Servicios migrados a `@Service()`** (sección 6).
- **App migrada a Zoneless**: `provideZonelessChangeDetection()`, sin `zone.js` en los polyfills (build y tests) y paquete desinstalado. Detalle en [signals-change-detection-zoneless.md](signals-change-detection-zoneless.md).

### Pendiente (opcional)
1. **Volver a activar los dos diagnósticos** del `tsconfig.app.json` y corregir los avisos que salgan, si sale alguno.

---

## Fuentes

- [Angular — Version compatibility](https://angular.dev/reference/versions)
- [Angular — Guía de resources](https://angular.dev/guide/signals/resource)
- [What's new in Angular 22.0 (Ninja Squad)](https://blog.ninja-squad.com/2026/06/03/what-is-new-angular-22.0)
- [What's new in Angular 21.0 (Ninja Squad)](https://blog.ninja-squad.com/2025/11/20/what-is-new-angular-21.0)
- [What's new in Angular 20.0 (Ninja Squad)](https://blog.ninja-squad.com/2025/05/28/what-is-new-angular-20.0)
- Tipos de `@angular/core`, `@angular/common` y `@angular/forms` 22.2 instalados en `node_modules` (para comprobar los nombres de las APIs).
