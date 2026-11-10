# Angular Signals — Fundamentos

## Que son las Signals

Una signal es un **contenedor reactivo** que guarda un valor y notifica automaticamente a todo lo que depende de ella cuando ese valor cambia.

```ts
import { signal } from '@angular/core';

const count = signal(0);       // crea una signal con valor inicial 0
console.log(count());          // lee el valor: 0
count.set(5);                  // cambia el valor a 5
console.log(count());          // 5
```

### Analogia Java

```java
// En Java, lo mas parecido es un campo observable (como en JavaFX)
SimpleIntegerProperty count = new SimpleIntegerProperty(0);
count.get();        // leer   → en Angular: count()
count.set(5);       // escribir → en Angular: count.set(5)
count.addListener((obs, old, newVal) -> { ... }); // reaccionar al cambio
```

La diferencia clave: en JavaFX tienes que registrar listeners manualmente. En Angular, las signals lo hacen automaticamente — Angular detecta que las estas usando en un template o en un `computed()` y se suscribe solo.

---

## Por que existen — el problema que resuelven

Antes de signals, Angular usaba **Zone.js** para saber cuando algo cambiaba. Zone.js funciona asi:

1. Angular parchea TODOS los eventos del navegador (click, setTimeout, fetch, etc.)
2. Despues de cada evento, Angular recorre TODOS los componentes para ver si algo cambio
3. Actualiza el DOM donde sea necesario

El problema: **Angular no sabe QUE cambio**, solo sabe que ALGO paso. Asi que comprueba todo, siempre.

```
Zone.js: "Alguien hizo click"
Angular: "No se que cambio... voy a revisar los 500 componentes por si acaso"
```

Con signals, Angular sabe EXACTAMENTE que cambio y que componentes dependen de ese valor:

```
Signal: "El valor de `count` cambio de 3 a 4"
Angular: "Solo 2 componentes usan `count`, actualizo solo esos 2"
```

### Antes vs Ahora

| | Antes (Zone.js) | Ahora (Signals) |
|---|---|---|
| Como detecta cambios | Parcheando eventos del navegador | El propio valor notifica |
| Que revisa | Todos los componentes | Solo los afectados |
| Rendimiento | O(n) componentes | O(1) los que usan el valor |
| Requiere Zone.js | Si | No (permite Zoneless) |

---

## Tipos de signal

### 1. `signal()` — WritableSignal (lectura + escritura)

```ts
import { signal } from '@angular/core';

// signal<T>(valorInicial): WritableSignal<T>
const name = signal('');                         // WritableSignal<string>
const count = signal(0);                         // WritableSignal<number>
const exercises = signal<Exercise[]>([]);         // WritableSignal<Exercise[]>
const error = signal<string | null>(null);        // WritableSignal<string | null>
```

Puedes leer Y escribir:
```ts
name();          // leer
name.set('Leg'); // escribir
```

### 2. `computed()` — Signal de solo lectura (derivada)

```ts
import { computed } from '@angular/core';

const count = signal(0);
const doubled = computed(() => count() * 2);

console.log(doubled());   // 0
count.set(3);
console.log(doubled());   // 6
```

Solo lectura — no puedes hacer `doubled.set(...)`. Su valor se calcula automaticamente a partir de otras signals.

### 3. `input()` — Signal de solo lectura (desde el padre)

```ts
import { input } from '@angular/core';

// Es una signal, pero su valor lo controla el componente padre
dayOfWeek = input.required<string>();

// En el template o en el .ts se lee igual
console.log(this.dayOfWeek());  // "Monday"
```

### Resumen de tipos

| Funcion | Tipo que devuelve | Lectura | Escritura | Quien controla el valor |
|---|---|---|---|---|
| `signal()` | `WritableSignal<T>` | Si | Si | El componente que la creo |
| `computed()` | `Signal<T>` | Si | No | Se calcula automaticamente |
| `input()` | `InputSignal<T>` | Si | No | El componente padre |

---

## Como leer una signal

**Siempre con `()`** — como si fuera una funcion.

```ts
// En TypeScript
const name = signal('Push-ups');
console.log(name());  // "Push-ups"
```

```html
<!-- En el template -->
<p>{{ name() }}</p>
<p>{{ exercises().length }} exercises</p>
```

### Ejemplo real del proyecto (ListExercisesComponent)

```ts
exercises = signal<ExerciseTemplateResponse[]>([]);
loading = signal(false);
error = signal<string | null>(null);
```

```html
@if (loading()) {
  <p>Loading...</p>
}

@if (error()) {
  <p class="text-error">{{ error() }}</p>
}

@for (exercise of exercises(); track exercise.id) {
  <p>{{ exercise.name }}</p>
}
```

Cada vez que se lee `loading()` en el template, Angular sabe que ese componente depende de `loading`. Cuando `loading` cambie, Angular re-renderiza SOLO ese componente.

---

## Como escribir/actualizar una signal

Solo `WritableSignal` se puede actualizar (las creadas con `signal()`). Hay dos metodos:

### `set(nuevoValor)` — reemplaza el valor entero

```ts
const count = signal(0);
count.set(5);           // ahora vale 5
count.set(10);          // ahora vale 10

const name = signal('');
name.set('Chest Day');  // ahora vale "Chest Day"

const exercises = signal<Exercise[]>([]);
exercises.set([e1, e2, e3]);  // reemplaza todo el array
```

Usar cuando: **ya tienes el nuevo valor completo** y no necesitas el anterior.

### `update(fn)` — calcula el nuevo valor a partir del anterior

```ts
const count = signal(0);
count.update(current => current + 1);  // 0 → 1
count.update(current => current + 1);  // 1 → 2

const exercises = signal<Exercise[]>([]);
// Agregar ejercicios al final
exercises.update(current => [...current, newExercise]);
// Quitar por indice
exercises.update(current => current.filter((_, i) => i !== index));
```

Usar cuando: **el nuevo valor depende del valor anterior**.

### Ejemplo real del proyecto (SelectExercisesComponent)

```ts
selectedExercises = signal<ExerciseTemplateResponse[]>([]);

// AGREGAR — necesita el array anterior → update
onExercisesSelected(exercises: ExerciseTemplateResponse[]): void {
  this.selectedExercises.update(current => [...current, ...exercises]);
}

// QUITAR — necesita el array anterior → update
removeExercise(index: number): void {
  this.selectedExercises.update(current => current.filter((_, i) => i !== index));
}

// REORDENAR — necesita el array anterior → update
moveExercise(index: number, direction: 'up' | 'down'): void {
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  this.selectedExercises.update(current => {
    const updated = [...current];
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    return updated;
  });
}
```

### Ejemplo real del proyecto (ListExercisesComponent)

```ts
loading = signal(false);
exercises = signal<ExerciseTemplateResponse[]>([]);

// CARGAR — tiene el valor nuevo directo del backend → set
loadExercises(): void {
  this.loading.set(true);
  this.exerciseService.getAll().subscribe({
    next: (data) => {
      this.exercises.set(data);      // reemplaza todo
      this.loading.set(false);       // valor directo, no depende del anterior
    },
  });
}

// TOGGLE SELECCION — necesita el Set anterior → update
toggleExercise(id: number): void {
  this.selection.update(current => {
    const next = new Set(current);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
}
```

### Regla rapida: set vs update

```
¿Necesitas el valor anterior para calcular el nuevo?
  → SI  → update(current => ...)
  → NO  → set(nuevoValor)
```

---

## Signals en servicios — estado compartido

Las signals no son solo para componentes. Cuando las pones en un servicio `providedIn: 'root'`, actuan como **estado global compartido**.

### Ejemplo real del proyecto (CreateRoutineStateService)

```ts
@Injectable({ providedIn: 'root' })
export class CreateRoutineStateService {
  programId = signal<number | null>(null);

  reset(): void {
    this.programId.set(null);
  }
}
```

```ts
// En Step2RoutineComponent — lee la signal del servicio
export class Step2RoutineComponent {
  private createRoutineState = inject(CreateRoutineStateService);
  programId = this.createRoutineState.programId;

  ngOnInit(): void {
    if (this.programId() === null) {
      this.router.navigate(['/create/step-1']);
    }
  }
}
```

### Analogia Java

```java
// Como un Singleton con un campo observable
@Singleton
public class CreateRoutineStateService {
    private final SimpleObjectProperty<Integer> programId =
        new SimpleObjectProperty<>(null);

    public ReadOnlyObjectProperty<Integer> getProgramId() {
        return programId;
    }

    public void reset() {
        programId.set(null);
    }
}
```

La signal en el servicio es como un campo mutable en un singleton — todos los componentes que lo inyectan ven el mismo valor, y reaccionan automaticamente cuando cambia.

---

## El grafo reactivo

Las signals forman un **grafo de dependencias** que Angular rastrea automaticamente:

```
signal(A) ──────────┐
                     ├──→ computed(C) ──→ Template
signal(B) ──────────┘
```

1. `A` y `B` son signals de escritura
2. `C` es un computed que depende de `A` y `B`
3. El template lee `C()`
4. Cuando `A` cambia → `C` se recalcula → el template se actualiza
5. Cuando `B` cambia → `C` se recalcula → el template se actualiza
6. Si ni `A` ni `B` cambian → `C` no se recalcula → el template no se toca

Angular construye este grafo automaticamente cuando llamas `()` dentro de un contexto reactivo (un template, un computed, o un effect). No necesitas declarar dependencias — Angular las descubre leyendo que signals se invocan.

### Analogia Java: esto es como las celdas de una hoja de calculo

```
Celda A1 = 5           → signal(5)
Celda B1 = 3           → signal(3)
Celda C1 = A1 + B1     → computed(() => a() + b())
```

Cuando cambias A1, C1 se recalcula automaticamente. No tienes que decirle a C1 que depende de A1 — la hoja de calculo lo sabe porque usaste A1 en la formula.

---

## Igualdad — cuando "cambia" realmente una signal

Por defecto, Angular usa `Object.is()` para decidir si una signal realmente cambio. Si haces `.set()` con el mismo valor, los dependientes NO se notifican:

```ts
const count = signal(0);
count.set(0);  // mismo valor → no notifica → no re-renderiza
```

Para objetos y arrays, `Object.is()` compara por **referencia**, no por contenido:

```ts
const list = signal([1, 2, 3]);
list.set([1, 2, 3]);  // array NUEVO → referencia diferente → SI notifica

list.update(current => current);  // MISMA referencia → NO notifica
```

Puedes personalizar la comparacion con `equal`:

```ts
const user = signal(
  { id: 1, name: 'Dan' },
  { equal: (a, b) => a.id === b.id }
);

user.set({ id: 1, name: 'Daniel' });  // mismo id → NO notifica
```

Esto es util para optimizar rendimiento cuando sabes que solo ciertos campos importan.
