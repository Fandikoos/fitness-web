# Patrón rxResource — Angular 22

> **Actualizado a Angular 22.** Cambios respecto a la versión de Angular 19 de esta nota:
> - `request` → **`params`** y `loader` → **`stream`** (renombrados en Angular 20).
> - `value()` **lanza una excepción** si el resource está en estado de error → protegerlo con `hasValue()`.
> - `resource()`, `rxResource()` y `httpResource()` son **estables** desde Angular 22 (en la 19 eran experimentales).

## Cuándo usar cada uno

- **rxResource / httpResource** → para peticiones GET (lectura de datos que el template muestra de forma reactiva)
- **Manual .subscribe()** → para POST, PUT, DELETE (acciones puntuales disparadas por el usuario)

## Cómo funciona rxResource

```
  params()           stream()              ResourceRef
 ┌──────────┐     ┌──────────────┐     ┌──────────────────┐
 │ signal A  ├──┐  │              │     │ .value()         │
 │ signal B  ├──┼─>│  Observable  ├────>│ .hasValue()      │
 │ signal C  ├──┘  │  (HTTP call) │     │ .isLoading()     │
 └──────────┘     └──────────────┘     │ .error()         │
                                        │ .status()        │
  Cuando cualquier      Se suscribe solo,     └──────────────────┘
  signal cambia,        cancela la petición   Signals integradas
  el stream se          anterior si estaba    que usas directo
  re-ejecuta            en vuelo              en el template
```

### Analogía Java

Es parecido a un `@Cacheable` de Spring cuya clave son las signals de `params()`: si la clave cambia, se vuelve a llamar al método. La diferencia es que aquí, además, el resultado es **reactivo**: el template se repinta solo cuando llega el dato.

## Anatomía de rxResource

```typescript
import { rxResource } from '@angular/core/rxjs-interop';

// 1. Definir las entradas reactivas (signals que disparan la recarga)
activeMuscleGroup = signal<string>('CHEST');
currentPage = signal(0);

// 2. Crear el resource
exercisesResource = rxResource({
  // params: Angular rastrea qué signals lees aquí.
  // Cuando CUALQUIERA cambia, el stream se re-ejecuta automáticamente.
  params: () => ({
    muscleGroup: this.activeMuscleGroup(),
    page: this.currentPage(),
  }),

  // stream: recibe { params }, debe devolver un Observable.
  // rxResource se suscribe internamente y se desuscribe al destruirse o al re-ejecutar.
  stream: ({ params }) =>
    this.exerciseService.getByMuscleGroup(params.page, 8, params.muscleGroup),
});
```

### Si `params()` devuelve `undefined`, no se hace la petición

Útil cuando falta un dato obligatorio (por ejemplo, un id que aún no ha llegado):

```typescript
routineResource = rxResource({
  // Mientras no haya id, el resource se queda en 'idle' y no llama al backend
  params: () => this.routineId() ?? undefined,
  stream: ({ params: id }) => this.routineService.getById(id),
});
```

### rxResource vs resource vs httpResource

| Función | Import | La función de carga se llama | Devuelve |
|---|---|---|---|
| `rxResource()` | `@angular/core/rxjs-interop` | **`stream`** | un `Observable` |
| `resource()` | `@angular/core` | **`loader`** (recibe `{ params, abortSignal }`) | una `Promise` |
| `httpResource()` | `@angular/common/http` | — (le pasas una función que devuelve la URL) | — |

Como nuestros servicios devuelven Observables de `HttpClient`, en este proyecto usamos `rxResource`.

`httpResource` es aún más corto, pero hace la petición directamente desde el componente (sin pasar por el servicio):

```typescript
import { httpResource } from '@angular/common/http';

// La URL DEBE ser una función (desde Angular 20): así es reactiva
programs = httpResource<ProgramResponse[]>(() => `/api/programs`);
```

## Signals del ResourceRef

| Signal / método  | Tipo             | Descripción                                                          |
|------------------|------------------|----------------------------------------------------------------------|
| `.value()`       | `T \| undefined` | La última respuesta exitosa. **Lanza excepción si `status()` es `'error'`** |
| `.hasValue()`    | `boolean`        | `true` si hay un valor disponible. Es el "guard" seguro antes de leer `value()` |
| `.isLoading()`   | `boolean`        | `true` mientras la petición está en vuelo (`'loading'` o `'reloading'`) |
| `.error()`       | `unknown`        | El error si la petición falló, si no `undefined`                     |
| `.status()`      | `ResourceStatus` | `'idle' \| 'loading' \| 'reloading' \| 'resolved' \| 'error' \| 'local'` |
| `.reload()`      | método           | Vuelve a lanzar la petición con los mismos params                    |

Estados de `status()`:
- `'idle'` → `params()` devolvió `undefined`, no se ha pedido nada
- `'loading'` → primera carga (o carga tras cambiar params)
- `'reloading'` → recarga con `reload()` (el valor anterior sigue disponible)
- `'resolved'` → la petición terminó bien
- `'error'` → la petición falló → **leer `value()` aquí lanza excepción**
- `'local'` → el valor se cambió a mano con `.set()` / `.update()`

> En la v19 `ResourceStatus` era un enum (`ResourceStatus.Loading`). Desde la v20 son strings: se compara con `status() === 'loading'`.

## Extraer datos con computed() — protegido con hasValue()

Cuando el Observable devuelve un objeto complejo (como un PageResponse), se usa `computed()` para extraer cada campo. **Ojo:** como `value()` lanza en estado de error, hay que comprobar antes `hasValue()`:

```typescript
// El resource devuelve PageResponse<Exercise> con { content, totalPages, totalElements }

// MAL — si la petición falla, value() lanza y rompe el template
exercises = computed(() => this.exercisesResource.value()?.content ?? []);

// BIEN — hasValue() es false en error, así que nunca se llega a leer value()
exercises     = computed(() => this.exercisesResource.hasValue() ? this.exercisesResource.value().content : []);
totalPages    = computed(() => this.exercisesResource.hasValue() ? this.exercisesResource.value().totalPages : 0);
totalElements = computed(() => this.exercisesResource.hasValue() ? this.exercisesResource.value().totalElements : 0);
```

Analogía Java: es como un `Optional` cuyo `get()` lanza excepción; `hasValue()` es tu `isPresent()`.

Estas signals computadas:
- Se recalculan automáticamente cuando `value()` cambia
- Devuelven el valor por defecto (`[]`, `0`) mientras carga o si hay error
- Se usan directamente en el template: `@for (ex of exercises(); track ex.id)`

## Uso en el template

```html
@if (exercisesResource.isLoading()) {
  <span class="loading loading-spinner"></span>
} @else if (exercisesResource.error()) {
  <div class="alert alert-error">Error al cargar</div>
} @else {
  @for (exercise of exercises(); track exercise.id) {
    <p>{{ exercise.name }}</p>
  }
}
```

Regla: **comprueba siempre el error antes de leer `value()`** (directamente o a través de un computed). Si el template lee `value()` fuera del `@if`/`@else` que comprueba el error, en cuanto falle la petición saltará una excepción.

## Disparar recargas

```typescript
// Opción A: cambiar una signal de la que depende params() → recarga automática
selectMuscleGroup(group: string): void {
  this.activeMuscleGroup.set(group);  // rxResource detecta el cambio y vuelve a pedir los datos
  this.currentPage.set(0);
}

// Opción B: forzar recarga sin cambiar signals (ej: después de un DELETE)
this.exercisesResource.reload();
```

## Comparación completa antes/después

### ANTES — signals manuales + subscribe

```typescript
exercises = signal<ExerciseTemplateResponse[]>([]);
loading = signal(false);
error = signal<string | null>(null);
totalPages = signal(0);
totalElements = signal(0);

selectMuscleGroup(group: string): void {
  this.activeMuscleGroup.set(group);
  this.currentPage.set(0);
  this.loadExercises();               // llamada manual obligatoria
}

private loadExercises(): void {
  this.loading.set(true);
  this.error.set(null);
  this.exerciseService.getByMuscleGroup(
    this.currentPage(), this.pageSize, this.activeMuscleGroup()
  ).subscribe({
    next: (data) => {
      this.exercises.set(data.content);
      this.totalPages.set(data.totalPages);
      this.totalElements.set(data.totalElements);
      this.loading.set(false);
    },
    error: () => {
      this.error.set('No se pudieron cargar los ejercicios');
      this.loading.set(false);
    },
  });
}
```

### DESPUÉS — rxResource (sintaxis Angular 20+)

```typescript
exercisesResource = rxResource({
  params: () => ({
    muscleGroup: this.activeMuscleGroup(),
    page: this.currentPage(),
  }),
  stream: ({ params }) =>
    this.exerciseService.getByMuscleGroup(params.page, this.pageSize, params.muscleGroup),
});

exercises     = computed(() => this.exercisesResource.hasValue() ? this.exercisesResource.value().content : []);
totalPages    = computed(() => this.exercisesResource.hasValue() ? this.exercisesResource.value().totalPages : 0);
totalElements = computed(() => this.exercisesResource.hasValue() ? this.exercisesResource.value().totalElements : 0);

selectMuscleGroup(group: string): void {
  this.activeMuscleGroup.set(group);   // solo cambias la signal, rxResource hace el resto
  this.currentPage.set(0);
}
```

Lo que se eliminó:
- 5 signals manuales (exercises, loading, error, totalPages, totalElements)
- El método loadExercises()
- Todas las llamadas manuales a loadExercises() (en open, selectMuscleGroup, goToPage)

## Novedades de resources en Angular 22 (para saber que existen)

- **`chain()`**: dentro de `params` permite que un resource dependa de otro (si el primero carga o falla, el segundo hereda ese estado).
- **Opción `id`**: identifica el resource para cachearlo con SSR (no aplica a este proyecto, que no usa SSR).
- **`debounced()`** (experimental): crea un resource a partir de una signal con un retardo, útil para buscadores:

```typescript
// Espera 300 ms sin cambios en searchTerm antes de emitir el valor
debouncedTerm = debounced(() => this.searchTerm(), 300);
```
