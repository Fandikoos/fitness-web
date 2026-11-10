# Patrón rxResource — Angular 19+

## Cuándo usar cada uno

- **rxResource / httpResource** -> para peticiones GET (lectura de datos que el template muestra de forma reactiva)
- **Manual .subscribe()** -> para POST, PUT, DELETE (acciones puntuales disparadas por el usuario)

## Cómo funciona rxResource

```
  request()          loader()              ResourceRef
 ┌──────────┐     ┌──────────────┐     ┌──────────────────┐
 │ signal A  ├──┐  │              │     │ .value()         │
 │ signal B  ├──┼─>│  Observable  ├────>│ .isLoading()     │
 │ signal C  ├──┘  │  (HTTP call) │     │ .error()         │
 └──────────┘     └──────────────┘     │ .status()        │
                                        └──────────────────┘
  Cuando cualquier      Se suscribe solo,     Signals integradas
  signal cambia,        cancela la petición   que usas directo
  el loader se          anterior si estaba    en el template
  re-ejecuta            en vuelo
```

## Anatomía de rxResource

```typescript
import { rxResource } from '@angular/core/rxjs-interop';

// 1. Definir las entradas reactivas (signals que disparan la recarga)
activeMuscleGroup = signal<string>('CHEST');
currentPage = signal(0);

// 2. Crear el resource
exercisesResource = rxResource({
  // request: Angular rastrea qué signals lees aquí.
  // Cuando CUALQUIERA cambia, el loader se re-ejecuta automáticamente.
  request: () => ({
    muscleGroup: this.activeMuscleGroup(),
    page: this.currentPage(),
  }),

  // loader: recibe el objeto del request, debe devolver un Observable.
  // rxResource se suscribe internamente y se desuscribe al destruirse o al re-ejecutar.
  loader: ({ request }) =>
    this.exerciseService.getByMuscleGroup(request.page, 8, request.muscleGroup),
});
```

## Signals del ResourceRef

| Signal           | Tipo             | Descripción                                          |
|------------------|------------------|------------------------------------------------------|
| `.value()`       | `T \| undefined` | La última respuesta exitosa                          |
| `.isLoading()`   | `boolean`        | True mientras la petición HTTP está en vuelo          |
| `.error()`       | `unknown`        | El error si la petición falló, sino undefined         |
| `.status()`      | `ResourceStatus` | Uno de: idle, loading, resolved, error, local         |

## Extraer datos con computed()

Cuando el Observable devuelve un objeto complejo (como un PageResponse), se usa `computed()` para extraer cada campo:

```typescript
// El resource devuelve PageResponse<Exercise> con { content, totalPages, totalElements }
exercises     = computed(() => this.exercisesResource.value()?.content ?? []);
totalPages    = computed(() => this.exercisesResource.value()?.totalPages ?? 0);
totalElements = computed(() => this.exercisesResource.value()?.totalElements ?? 0);
```

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

## Disparar recargas

```typescript
// Opción A: Cambiar una signal de la que depende request() -> recarga automática
selectMuscleGroup(group: string): void {
  this.activeMuscleGroup.set(group);  // rxResource detecta el cambio y re-fetcha
  this.currentPage.set(0);
}

// Opción B: Forzar recarga sin cambiar signals (ej: después de un DELETE)
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
      this.error.set('Failed to load exercises');
      this.loading.set(false);
    },
  });
}
```

### DESPUÉS — rxResource

```typescript
exercisesResource = rxResource({
  request: () => ({
    muscleGroup: this.activeMuscleGroup(),
    page: this.currentPage(),
  }),
  loader: ({ request }) =>
    this.exerciseService.getByMuscleGroup(request.page, this.pageSize, request.muscleGroup),
});

exercises     = computed(() => this.exercisesResource.value()?.content ?? []);
totalPages    = computed(() => this.exercisesResource.value()?.totalPages ?? 0);
totalElements = computed(() => this.exercisesResource.value()?.totalElements ?? 0);

selectMuscleGroup(group: string): void {
  this.activeMuscleGroup.set(group);   // solo seteas la signal, rxResource hace el resto
  this.currentPage.set(0);
}
```

Lo que se eliminó:
- 5 signals manuales (exercises, loading, error, totalPages, totalElements)
- El método loadExercises()
- Todas las llamadas manuales a loadExercises() (en open, selectMuscleGroup, goToPage)
