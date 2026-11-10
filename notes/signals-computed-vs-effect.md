# Computed vs Effect — Datos derivados y efectos secundarios

Este es probablemente el concepto mas importante de entender bien con signals. La diferencia entre `computed()` y `effect()` define como se estructura la logica reactiva en Angular.

---

## computed() — Datos que se calculan solos

`computed()` crea una signal de solo lectura cuyo valor se **deriva** de otras signals. Se recalcula automaticamente cuando alguna de sus dependencias cambia.

```ts
import { signal, computed } from '@angular/core';

const price = signal(100);
const quantity = signal(3);
const total = computed(() => price() * quantity());

console.log(total());  // 300
quantity.set(5);
console.log(total());  // 500 — se recalculo solo
```

### Caracteristicas clave de computed

#### 1. Es lazy (perezoso) — solo calcula cuando alguien lo lee

```ts
const price = signal(100);
const quantity = signal(3);
const total = computed(() => {
  console.log('Calculando...');
  return price() * quantity();
});

// Nada pasa todavia — nadie ha leido total()

price.set(200);
// Sigue sin pasar nada — nadie ha leido total()

console.log(total());
// AHORA se ejecuta: "Calculando..." → 600
```

Esto es importante: computed no se ejecuta cada vez que una dependencia cambia. Se marca como "sucio" (dirty) y solo recalcula cuando alguien lo lee. Esto lo hace muy eficiente.

#### 2. Esta memoizado — no recalcula si las dependencias no cambiaron

```ts
const name = signal('Push-ups');
const upper = computed(() => name().toUpperCase());

console.log(upper());  // "PUSH-UPS" — calcula
console.log(upper());  // "PUSH-UPS" — devuelve el valor cacheado, NO recalcula
console.log(upper());  // "PUSH-UPS" — sigue cacheado

name.set('Squats');    // marca upper como "sucio"
console.log(upper());  // "SQUATS" — ahora SI recalcula
```

#### 3. Es de solo lectura — no puedes hacer .set() ni .update()

```ts
const total = computed(() => price() * quantity());
total.set(999);  // ERROR de compilacion — computed es read-only
```

#### 4. Debe ser puro — sin efectos secundarios

```ts
// BIEN — puro, solo calcula y devuelve
const fullName = computed(() => `${firstName()} ${lastName()}`);
const hasExercises = computed(() => exercises().length > 0);
const sortedExercises = computed(() =>
  [...exercises()].sort((a, b) => a.name.localeCompare(b.name))
);

// MAL — tiene efectos secundarios
const total = computed(() => {
  const value = price() * quantity();
  console.log('Total changed!');    // efecto secundario
  localStorage.setItem('total', String(value));  // efecto secundario
  return value;
});
```

Un computed debe ser una funcion pura: mismas entradas → misma salida, sin tocar nada externo. Si necesitas hacer algo cuando un valor cambia, eso es un `effect()`.

### Analogia Java

```java
// computed es como un getter derivado que se cachea automaticamente
public class Order {
    private int price;      // signal
    private int quantity;   // signal

    // computed — se recalcula solo cuando price o quantity cambian
    public int getTotal() {
        return price * quantity;
    }
}
```

La diferencia: en Java este getter se ejecuta cada vez que lo llamas. Un `computed()` de Angular solo recalcula si las dependencias cambiaron — si no, devuelve el valor cacheado.

### Ejemplos practicos con computed

```ts
// Filtrar una lista
exercises = signal<Exercise[]>([]);
searchTerm = signal('');

filteredExercises = computed(() => {
  const term = this.searchTerm().toLowerCase();
  if (!term) return this.exercises();
  return this.exercises().filter(e =>
    e.name.toLowerCase().includes(term)
  );
});

// Contar elementos
exerciseCount = computed(() => this.exercises().length);

// Validar estado
canSubmit = computed(() =>
  this.selectedExercises().length > 0 && !this.loading()
);

// Transformar datos para el template
exerciseSummary = computed(() =>
  this.selectedExercises()
    .map(e => e.name)
    .join(', ')
);

// Combinar multiples signals
routineTitle = computed(() => {
  const day = this.dayOfWeek();
  const name = this.routineName();
  return name ? `${name} (${day})` : day;
});
```

---

## effect() — Reaccionar a cambios con efectos secundarios

`effect()` ejecuta una funcion cada vez que **cualquier signal que lee dentro** cambia de valor. Es para **efectos secundarios**: cosas que pasan "fuera" del sistema reactivo.

```ts
import { signal, effect } from '@angular/core';

const count = signal(0);

effect(() => {
  console.log('Count is now:', count());
  // Se ejecuta inmediatamente: "Count is now: 0"
  // Y cada vez que count cambie
});

count.set(1);  // "Count is now: 1"
count.set(2);  // "Count is now: 2"
```

### Caracteristicas clave de effect

#### 1. Es eager (ansioso) — se ejecuta inmediatamente y ante cada cambio

A diferencia de `computed()` que es lazy, `effect()` se ejecuta:
- Una vez al crearse (para establecer las dependencias iniciales)
- Cada vez que una dependencia cambia

```ts
const name = signal('Push-ups');

effect(() => {
  console.log(name());  // Se ejecuta AHORA: "Push-ups"
});

name.set('Squats');     // Se ejecuta de nuevo: "Squats"
```

#### 2. No devuelve un valor — es void

```ts
// computed devuelve un valor
const doubled = computed(() => count() * 2);  // devuelve number

// effect NO devuelve un valor
effect(() => {
  console.log(count());  // solo hace algo, no retorna nada
});
```

#### 3. Solo funciona en un "contexto de inyeccion"

```ts
// BIEN — en la declaracion de campo del componente
export class MyComponent {
  count = signal(0);

  logger = effect(() => {
    console.log(this.count());
  });
}

// BIEN — en el constructor
export class MyComponent {
  count = signal(0);

  constructor() {
    effect(() => {
      console.log(this.count());
    });
  }
}

// MAL — fuera de un contexto de inyeccion (ngOnInit, metodos, etc.)
export class MyComponent {
  ngOnInit(): void {
    effect(() => { ... });  // ERROR: no hay injection context
  }
}

// SOLUCION — inyectar manualmente si necesitas crearlo en otro lugar
export class MyComponent {
  private injector = inject(Injector);

  ngOnInit(): void {
    effect(() => { ... }, { injector: this.injector });  // ahora funciona
  }
}
```

#### 4. Se destruye automaticamente con el componente

Cuando el componente se destruye, sus effects se limpian automaticamente. No necesitas hacer unsubscribe manual.

```ts
export class MyComponent {
  // Se limpia automaticamente cuando el componente se destruye
  logger = effect(() => {
    console.log(this.count());
  });
}
```

Si necesitas destruirlo antes, puedes hacerlo manualmente:

```ts
export class MyComponent {
  private loggerRef = effect(() => {
    console.log(this.count());
  });

  stopLogging(): void {
    this.loggerRef.destroy();  // para el effect manualmente
  }
}
```

#### 5. Cleanup function — limpiar recursos del ciclo anterior

```ts
effect((onCleanup) => {
  const id = setInterval(() => {
    console.log('Value:', this.count());
  }, 1000);

  // Se ejecuta ANTES de la siguiente ejecucion del effect,
  // o cuando el effect se destruye
  onCleanup(() => {
    clearInterval(id);
  });
});
```

### Ejemplo real del proyecto: pre-rellenar formulario con datos asincronos

En `SelectExercisesComponent`, cada dia de la semana recibe un input `routines` que viene de una peticion HTTP. El problema: cuando `ngOnInit` se ejecuta, la peticion aun no respondio y `routines()` es un array vacio. No podemos usar `computed()` porque necesitamos hacer side effects (patchear un formulario reactivo y escribir en signals).

```ts
// select-exercises.component.ts
export class SelectExercisesComponent implements OnInit {
  dayOfWeek = input.required<string>();
  routines = input.required<RoutineResponse[]>();  // llega vacio, se llena despues

  routineForm = this.fb.nonNullable.group({ ... });
  selectedExercises = signal<ExerciseTemplateResponse[]>([]);
  private existingRoutineId = signal<number | null>(null);
  private prefilled = false;

  constructor() {
    // effect() observa routines() — cuando el HTTP responde y el padre
    // actualiza la signal, este effect se dispara automaticamente
    effect(() => {
      const routines = this.routines();
      if (routines.length > 0 && !this.prefilled) {
        this.prefillFromExistingRoutine();
      }
    });
  }

  // ¿Por que NO funciona en ngOnInit?
  // ngOnInit se ejecuta UNA vez. Si routines() aun esta vacio (HTTP en vuelo),
  // find() no encuentra nada y el formulario queda vacio para siempre.

  // ¿Por que NO usar computed?
  // Necesitamos hacer side effects: patchValue en el form y set() en signals.
  // computed() debe ser puro — sin efectos secundarios.

  private prefillFromExistingRoutine(): void {
    const existing = this.routines().find(
      r => r.dayOfWeek.toUpperCase() === this.dayOfWeek().toUpperCase()
    );
    if (!existing) return;

    this.prefilled = true;  // evita re-ejecutar si routines cambia de nuevo
    this.existingRoutineId.set(existing.id);
    this.routineForm.patchValue({
      name: existing.name,
      description: existing.description,
    });
    this.selectedExercises.set(
      existing.exercises.map(e => e.exerciseTemplate)
    );
  }
}
```

El flag `prefilled` es clave: sin el, si el padre re-emite routines (por ejemplo tras guardar), el effect machacaria los cambios que el usuario haya hecho en el formulario.

### Mas ejemplos practicos con effect

```ts
// Logging / debug
effect(() => {
  console.log('Exercises loaded:', this.exercises().length);
});

// Sincronizar con localStorage
effect(() => {
  localStorage.setItem('theme', this.selectedTheme());
});

// Sincronizar con el DOM (API imperativa)
private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

effect(() => {
  const ctx = this.canvas().nativeElement.getContext('2d');
  ctx.fillText(this.label(), 10, 50);  // actualiza el canvas
});

// Llamar a una API externa cuando cambia un filtro
effect(() => {
  const category = this.selectedCategory();
  // cada vez que cambie la categoria, recargar ejercicios
  this.exerciseService.getByCategory(category).subscribe(data => {
    this.exercises.set(data);
  });
});

// Sincronizar titulo de la pagina
effect(() => {
  document.title = `${this.routineName()} - Fitness App`;
});

// Navegar cuando un valor cambia
effect(() => {
  if (this.programId() === null) {
    this.router.navigate(['/create/step-1']);
  }
});
```

---

## La comparacion directa: computed vs effect

| | `computed()` | `effect()` |
|---|---|---|
| **Proposito** | Derivar un nuevo valor | Ejecutar un efecto secundario |
| **Devuelve** | `Signal<T>` (un valor) | `EffectRef` (void, no un valor) |
| **Lectura/escritura** | Solo lectura | No aplica (no es una signal) |
| **Cuando se ejecuta** | Lazy — solo cuando alguien lo lee | Eager — inmediatamente y en cada cambio |
| **Memoizado** | Si — cachea el resultado | No aplica |
| **Puro** | DEBE ser puro (sin side effects) | Es PARA side effects |
| **Ejemplo mental** | Celda de Excel que calcula | Un trigger de base de datos |

### Analogia Java

```java
// computed = getter derivado (calculado)
public int getTotal() {
    return this.price * this.quantity;
}

// effect = trigger/listener que reacciona a cambios
propertyChangeSupport.addPropertyChangeListener("price", evt -> {
    System.out.println("Price changed to: " + evt.getNewValue());
    auditLog.save("price_update", evt.getNewValue());
});
```

---

## Regla de oro: cuando usar cada uno

```
¿Necesitas CALCULAR un valor a partir de otras signals?
  → computed()

¿Necesitas HACER ALGO (efecto secundario) cuando una signal cambia?
  → effect()
```

### Mas especifico:

**Usa computed() cuando:**
- Filtras, ordenas o transformas datos
- Combinas multiples signals en un valor derivado
- Necesitas un valor booleano que depende de estado (canSubmit, isEmpty, isValid)
- Formateas datos para mostrar en el template
- Cuentas elementos

**Usa effect() cuando:**
- Reaccionas a un input signal que llega asincronamente (ej: pre-rellenar un form cuando llegan datos HTTP)
- Escribes en localStorage o sessionStorage
- Haces console.log para debug
- Llamas a APIs imperativas del DOM (canvas, focus, scroll)
- Sincronizas con servicios externos
- Navegas programaticamente
- Actualizas el titulo de la pagina

### Anti-patron comun: usar effect para derivar datos

```ts
// MAL — usando effect para lo que deberia ser computed
count = signal(0);
doubled = signal(0);

constructor() {
  effect(() => {
    this.doubled.set(this.count() * 2);  // NO HAGAS ESTO
  });
}

// BIEN — computed
count = signal(0);
doubled = computed(() => this.count() * 2);
```

¿Por que es malo el effect? Porque:
1. Creas un segundo "source of truth" — ahora doubled es independiente de count
2. Hay un frame donde doubled tiene el valor antiguo (asincronia)
3. Es mas codigo para lo mismo
4. Si lees `doubled` en otro computed, creates una cadena fragil

**Regla: si puedes expresarlo como computed, SIEMPRE usa computed. Solo usa effect cuando necesitas hacer algo que NO es calcular un valor.**

---

## Patrones avanzados

### computed con logica condicional

```ts
showAdvanced = signal(false);
exercises = signal<Exercise[]>([]);
advancedExercises = signal<Exercise[]>([]);

// Angular rastrea DINAMICAMENTE que signals se leen
displayedExercises = computed(() => {
  if (this.showAdvanced()) {
    return this.advancedExercises();  // depende de advancedExercises
  }
  return this.exercises();            // depende de exercises
});
```

Cuando `showAdvanced` es false, Angular solo rastrea `exercises` como dependencia. Si `advancedExercises` cambia, el computed NO se recalcula porque en la ultima ejecucion no la leyo. Esto es el "dynamic dependency tracking" — las dependencias se descubren en cada ejecucion.

### Cadenas de computed

```ts
exercises = signal<Exercise[]>([]);
searchTerm = signal('');
sortBy = signal<'name' | 'category'>('name');

// Paso 1: filtrar
filtered = computed(() => {
  const term = this.searchTerm().toLowerCase();
  return this.exercises().filter(e =>
    e.name.toLowerCase().includes(term)
  );
});

// Paso 2: ordenar (depende del resultado filtrado)
sorted = computed(() => {
  const key = this.sortBy();
  return [...this.filtered()].sort((a, b) =>
    a[key].localeCompare(b[key])
  );
});

// Paso 3: estadisticas (depende del resultado filtrado)
stats = computed(() => ({
  total: this.exercises().length,
  showing: this.filtered().length,
}));
```

```
exercises ──┐
searchTerm ─┤
             ├──→ filtered ──┬──→ sorted ──→ Template
sortBy ──────────────────────┘
             └──→ stats ──→ Template
```

Cada computed solo se recalcula si sus dependencias directas cambian. Si cambias `sortBy`, solo `sorted` se recalcula — `filtered` y `stats` no se tocan porque no dependen de `sortBy`.

### effect con allowSignalWrites

Por defecto, no puedes escribir signals dentro de un effect (para evitar ciclos infinitos). Si realmente necesitas hacerlo:

```ts
// Angular lanza un error por defecto
effect(() => {
  this.otherSignal.set(this.count() * 2);  // ERROR
});

// Para permitirlo explicitamente:
effect(() => {
  this.otherSignal.set(this.count() * 2);
}, { allowSignalWrites: true });
```

Pero si necesitas `allowSignalWrites`, casi seguro que deberias usar `computed()` en su lugar. Es una senal de alarma de que estas usando effect para derivar datos.

Las excepciones validas son pocas:
- Resetear un formulario cuando cambia una condicion
- Sincronizar estado legacy (BehaviorSubject ↔ signal)
- Logging + actualizar un contador de logs

### linkedSignal() — la alternativa a effect + allowSignalWrites

Angular 19 introdujo `linkedSignal()` para el caso especifico donde necesitas una signal escribible cuyo valor inicial depende de otra signal:

```ts
import { linkedSignal } from '@angular/core';

categories = signal(['Chest', 'Back', 'Legs']);

// Su valor se resetea cada vez que categories cambia,
// pero TAMBIEN se puede escribir manualmente
selectedCategory = linkedSignal(() => this.categories()[0]);

// Se lee como cualquier signal
console.log(this.selectedCategory());  // "Chest"

// Se puede escribir manualmente
this.selectedCategory.set('Back');     // "Back"

// Pero si categories cambia, se resetea al primero
this.categories.set(['Arms', 'Core']);
console.log(this.selectedCategory());  // "Arms" — se reseteo
```

Sin `linkedSignal`, tendrias que usar effect + allowSignalWrites:

```ts
// MAL — la forma vieja de hacerlo
selectedCategory = signal('');

constructor() {
  effect(() => {
    this.selectedCategory.set(this.categories()[0]);
  }, { allowSignalWrites: true });
}
```

`linkedSignal` es la solucion oficial para este patron. Usalo cuando necesitas un valor que:
1. Se inicializa/resetea a partir de otra signal
2. Pero el usuario puede modificarlo manualmente despues
