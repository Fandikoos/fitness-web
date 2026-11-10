# Signals — Buenas practicas y patrones

Guia de patrones recomendados, anti-patrones a evitar, y como combinar signals con RxJS.

---

## Reglas fundamentales

### 1. Siempre OnPush + signals

```ts
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,  // siempre
})
export class MyComponent {
  data = signal<Data[]>([]);  // estado como signal, siempre
}
```

No uses variables normales para estado que se muestra en el template. Con Zoneless, simplemente no funcionaran.

### 2. Computed antes que effect — siempre

Si puedes expresar algo como un computed, usa computed. Effect es el ultimo recurso.

```ts
// PREFERIR — computed
hasExercises = computed(() => this.exercises().length > 0);

// EVITAR — effect para derivar datos
hasExercises = signal(false);
constructor() {
  effect(() => {
    this.hasExercises.set(this.exercises().length > 0);
  }, { allowSignalWrites: true });
}
```

### 3. Signals para estado, Observables para eventos/streams

```ts
// Signal — para estado que tiene un "valor actual"
exercises = signal<Exercise[]>([]);
loading = signal(false);
selectedId = signal<number | null>(null);

// Observable — para streams de eventos, HTTP, WebSockets
exercises$ = this.http.get<Exercise[]>('/api/exercises');
searchResults$ = this.searchTerm$.pipe(
  debounceTime(300),
  switchMap(term => this.api.search(term))
);
```

Regla rapida:
```
¿Tiene sentido preguntar "cual es el valor ACTUAL"?
  → SI  → signal (loading, selectedItem, count)
  → NO  → observable (clicks, HTTP requests, WebSocket messages)
```

---

## Patrones recomendados

### Patron: cargar datos del backend

```ts
export class ListExercisesComponent {
  private exerciseService = inject(ExerciseService);

  exercises = signal<ExerciseTemplateResponse[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadExercises();
  }

  private loadExercises(): void {
    this.loading.set(true);
    this.error.set(null);
    this.exerciseService.getAll().subscribe({
      next: (data) => {
        this.exercises.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load exercises');
        this.loading.set(false);
      },
    });
  }
}
```

Template:
```html
@if (loading()) {
  <span class="loading loading-spinner"></span>
}

@if (error(); as err) {
  <div class="alert alert-error">{{ err }}</div>
}

@for (exercise of exercises(); track exercise.id) {
  <p>{{ exercise.name }}</p>
} @empty {
  <p>No exercises found</p>
}
```

Este patron usa tres signals separadas (`exercises`, `loading`, `error`) en lugar de un unico objeto `{ data, loading, error }`. Esto permite actualizar cada estado independientemente y que el template reaccione granularmente.

### Patron: filtro + lista

```ts
export class ExerciseListComponent {
  private exerciseService = inject(ExerciseService);

  exercises = signal<Exercise[]>([]);
  searchTerm = signal('');
  selectedCategory = signal<string | null>(null);

  filteredExercises = computed(() => {
    let result = this.exercises();
    const term = this.searchTerm().toLowerCase();
    const category = this.selectedCategory();

    if (term) {
      result = result.filter(e =>
        e.name.toLowerCase().includes(term)
      );
    }
    if (category) {
      result = result.filter(e => e.category === category);
    }
    return result;
  });

  resultCount = computed(() => this.filteredExercises().length);
}
```

```html
<input type="text"
  [value]="searchTerm()"
  (input)="searchTerm.set($event.target.value)"
  placeholder="Search exercises..." />

<p>{{ resultCount() }} results</p>

@for (exercise of filteredExercises(); track exercise.id) {
  ...
}
```

Observa la cadena: `exercises` + `searchTerm` + `selectedCategory` → `filteredExercises` → `resultCount`. Todo se recalcula automaticamente y en orden.

### Patron: toggle / switch de estado

```ts
showFilters = signal(false);

toggleFilters(): void {
  this.showFilters.update(current => !current);
}
```

```html
<button (click)="toggleFilters()">
  {{ showFilters() ? 'Hide' : 'Show' }} Filters
</button>

@if (showFilters()) {
  <div class="filters">...</div>
}
```

### Patron: estado compartido entre componentes via servicio

```ts
// core/services/ui-state.service.ts
@Injectable({ providedIn: 'root' })
export class UiStateService {
  sidebarOpen = signal(false);
  selectedTheme = signal<'light' | 'dark'>('light');

  toggleSidebar(): void {
    this.sidebarOpen.update(open => !open);
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.selectedTheme.set(theme);
  }
}
```

```ts
// Cualquier componente puede inyectarlo y reaccionar
export class NavbarComponent {
  private ui = inject(UiStateService);
  sidebarOpen = this.ui.sidebarOpen;  // exponer la signal directamente

  toggle(): void {
    this.ui.toggleSidebar();
  }
}
```

En el template del navbar:
```html
<button (click)="toggle()">
  {{ sidebarOpen() ? 'Close' : 'Open' }}
</button>
```

### Patron: exponer signal de solo lectura desde un servicio

Si quieres que los componentes lean pero no escriban:

```ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  // Privada y escribible
  private _user = signal<User | null>(null);

  // Publica y de solo lectura
  user = this._user.asReadonly();

  // Solo el servicio puede cambiarla
  login(credentials: Credentials): void {
    this.http.post<User>('/api/login', credentials).subscribe(user => {
      this._user.set(user);
    });
  }

  logout(): void {
    this._user.set(null);
  }
}
```

```ts
// En un componente
export class ProfileComponent {
  private auth = inject(AuthService);
  user = this.auth.user;  // Signal<User | null> — solo lectura

  // this.user.set(...)  → ERROR de compilacion
}
```

`asReadonly()` convierte un `WritableSignal<T>` en un `Signal<T>`, ocultando `set()` y `update()`.

### Analogia Java

```java
// Es como exponer un campo con solo getter, sin setter
public class AuthService {
    private User user;  // privado, escribible internamente

    public User getUser() {  // publico, solo lectura
        return user;
    }
}
```

---

## Anti-patrones — que NO hacer

### Anti-patron 1: effect para derivar datos

```ts
// MAL
count = signal(0);
isEven = signal(false);

constructor() {
  effect(() => {
    this.isEven.set(this.count() % 2 === 0);
  }, { allowSignalWrites: true });
}

// BIEN
count = signal(0);
isEven = computed(() => this.count() % 2 === 0);
```

### Anti-patron 2: mutar el valor interno de una signal

```ts
// MAL — mutar el array interno
exercises = signal<Exercise[]>([]);

addExercise(exercise: Exercise): void {
  this.exercises().push(exercise);  // muta el array, la signal NO se entera
}

// BIEN — crear un nuevo array
addExercise(exercise: Exercise): void {
  this.exercises.update(current => [...current, exercise]);
}
```

Las signals comparan por referencia. Si mutas el contenido sin cambiar la referencia, la signal no detecta el cambio y el template no se actualiza.

```
exercises().push(item)    → MISMA referencia → signal no notifica → template no cambia
exercises.update(...)     → NUEVA referencia → signal notifica    → template se actualiza
```

### Analogia Java

```java
// Es la diferencia entre mutar un objeto y crear uno nuevo
List<Exercise> list = exercises.get();
list.add(exercise);          // mutar el mismo objeto — el "observable" no se entera
exercises.set(new ArrayList<>(list));  // nuevo objeto — el "observable" notifica
```

### Anti-patron 3: leer signals fuera del contexto reactivo y esperar reactividad

```ts
// MAL — esto captura el valor UNA VEZ, no es reactivo
ngOnInit(): void {
  const currentExercises = this.exercises();  // valor fijo, no se actualiza
  // si exercises cambia despues, currentExercises sigue con el valor viejo
}

// BIEN — leer en computed/template para mantener reactividad
filteredExercises = computed(() => {
  return this.exercises().filter(e => e.active);  // se actualiza automaticamente
});
```

Leer una signal con `()` en codigo normal te da el valor en ese momento, como una foto. No se actualiza. La reactividad solo funciona dentro de contextos reactivos: templates, computed(), effect().

### Anti-patron 4: effect infinito

```ts
// MAL — ciclo infinito
count = signal(0);

constructor() {
  effect(() => {
    console.log(this.count());
    this.count.update(c => c + 1);  // cambia count → dispara el effect → repite
  }, { allowSignalWrites: true });
}
```

### Anti-patron 5: demasiadas signals granulares vs una signal de objeto

```ts
// DEMASIADO GRANULAR — si siempre cambian juntas
firstName = signal('');
lastName = signal('');
email = signal('');
phone = signal('');

// MEJOR — agrupar en un objeto si son un "bloque logico"
userForm = signal({ firstName: '', lastName: '', email: '', phone: '' });

// PERO... si cada campo se actualiza/lee independientemente,
// signals separadas ES lo correcto
loading = signal(false);    // cambia independientemente
error = signal<string | null>(null);  // cambia independientemente
data = signal<Data[]>([]);  // cambia independientemente
```

Regla: **agrupa si siempre cambian juntas, separa si cambian independientemente**.

---

## Signals y RxJS — convivencia

Signals no reemplazan RxJS. Se complementan. Angular proporciona funciones para convertir entre ambos:

### Observable → Signal: `toSignal()`

```ts
import { toSignal } from '@angular/core/rxjs-interop';

export class MyComponent {
  private http = inject(HttpClient);

  // Convierte un Observable en una Signal
  exercises = toSignal(
    this.http.get<Exercise[]>('/api/exercises'),
    { initialValue: [] }  // valor mientras el HTTP no responde
  );
}
```

```html
<!-- Se usa como cualquier signal -->
@for (exercise of exercises(); track exercise.id) {
  <p>{{ exercise.name }}</p>
}
```

`toSignal()` se suscribe al observable, guarda cada valor emitido en una signal, y se desuscribe automaticamente cuando el componente se destruye.

### Signal → Observable: `toObservable()`

```ts
import { toObservable } from '@angular/core/rxjs-interop';

export class SearchComponent {
  searchTerm = signal('');

  // Convierte la signal en un Observable para usar operadores RxJS
  results = toSignal(
    toObservable(this.searchTerm).pipe(
      debounceTime(300),        // espera 300ms sin escribir
      distinctUntilChanged(),   // ignora si no cambio
      switchMap(term =>         // cancela la peticion anterior
        this.api.search(term)
      ),
    ),
    { initialValue: [] }
  );
}
```

Este es el patron perfecto cuando necesitas operadores de RxJS (debounce, switchMap, retry, etc.) pero quieres que el resultado final sea una signal para el template.

### Cuando usar cada uno

| Usa Signal cuando | Usa Observable/RxJS cuando |
|---|---|
| Estado con valor actual | Streams de eventos |
| UI state (loading, error, selected) | HTTP con operadores (retry, debounce) |
| Estado compartido en servicios | WebSockets |
| Datos derivados simples (computed) | Combinaciones complejas de streams |
| Inputs/outputs de componentes | Cancelacion (switchMap, takeUntil) |

---

## Checklist de buenas practicas

1. **OnPush en todos los componentes** — sin excepciones
2. **Signals para todo estado del template** — nunca variables normales
3. **computed antes que effect** — si puedes expresarlo como derivado, hazlo
4. **Inmutabilidad** — nunca mutes el contenido de una signal, crea valores nuevos
5. **Signals en servicios para estado compartido** — con `asReadonly()` para exponer
6. **toSignal/toObservable** — para conectar signals con RxJS donde sea necesario
7. **No guardes el valor de una signal en una variable** — lee la signal donde la necesites
8. **Separa signals que cambian independientemente, agrupa las que cambian juntas**
9. **`linkedSignal()` para signals escribibles que dependen de otra** — no effect + allowSignalWrites
10. **effect() solo para side effects reales** — logging, localStorage, DOM imperativo, navegacion

---

## Resumen del ecosistema reactivo de Angular

```
┌─────────────────────────────────────────────────────────┐
│                    ESTADO                                │
│                                                          │
│   signal()      → estado local/global escribible         │
│   input()       → estado del padre (solo lectura)        │
│   linkedSignal()→ escribible, pero vinculado a otra      │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                    DERIVADO                               │
│                                                          │
│   computed()    → valor calculado, lazy, memoizado        │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                    EFECTOS                                │
│                                                          │
│   effect()      → side effects (logs, API, DOM, nav)     │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                    INTEROP                                │
│                                                          │
│   toSignal()    → Observable → Signal                    │
│   toObservable()→ Signal → Observable                    │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                    RENDIMIENTO                            │
│                                                          │
│   OnPush        → solo re-check cuando hay razon         │
│   Zoneless      → sin Zone.js, signals como motor        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Orden de lectura recomendado

1. [signals-fundamentals.md](signals-fundamentals.md) — que son, como crearlas, set vs update
2. [signals-computed-vs-effect.md](signals-computed-vs-effect.md) — computed vs effect en profundidad
3. [signals-change-detection-zoneless.md](signals-change-detection-zoneless.md) — como signals reemplazan a Zone.js
4. [signals-best-practices.md](signals-best-practices.md) — este archivo, patrones y anti-patrones
