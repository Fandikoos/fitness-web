# Input y Output en Angular

Mecanismo para comunicar componentes padre e hijo.

- **`input()`** — el padre pasa datos AL hijo (datos hacia abajo)
- **`output()`** — el hijo emite eventos AL padre (eventos hacia arriba)

---

## Input — recibir datos del padre

### Sintaxis moderna (signal-based, Angular 17+)

```ts
// En el hijo
import { input } from '@angular/core';

export class ChildComponent {
  name = input<string>();              // opcional, puede ser undefined
  name = input('default value');       // con valor por defecto
  name = input.required<string>();     // obligatorio, error si el padre no lo pasa
}
```

```html
<!-- En el template del padre -->
<app-child [name]="'Pecho'" />
<app-child [name]="variableDelPadre" />
```

### Equivalente Java conceptual

```java
// Como un parametro de constructor obligatorio
public class ChildComponent {
    private final String name;  // input.required = parametro obligatorio

    public ChildComponent(String name) {
        this.name = name;
    }
}
```

### Leer el valor de un input en el componente

```ts
// Como es un signal, se lee con ()
ngOnInit(): void {
  console.log(this.name());  // "Pecho"
}
```

```html
<!-- En el template se lee igual, con () -->
<p>{{ name() }}</p>
```

### Sintaxis antigua (decorador @Input — ya NO se recomienda)

```ts
// Forma vieja, evitar en Angular 17+
@Input() name: string = '';
@Input({ required: true }) name!: string;
```

La diferencia: la forma vieja usa decoradores y no es reactiva (no es signal).
La forma nueva devuelve un signal, se integra con `computed()` y `effect()`.

---

## Output — emitir eventos al padre

### Sintaxis moderna (Angular 17+)

```ts
// En el hijo
import { output } from '@angular/core';

export class ChildComponent {
  exercisesSelected = output<ExerciseTemplateResponse[]>();

  confirm(): void {
    this.exercisesSelected.emit(selectedExercises);
  }
}
```

```html
<!-- En el template del padre -->
<app-child (exercisesSelected)="onExercisesSelected($event)" />
```

```ts
// En el padre
onExercisesSelected(exercises: ExerciseTemplateResponse[]): void {
  console.log('Recibidos:', exercises);
}
```

### Equivalente Java conceptual

```java
// Como el patron Observer/Listener de Java
public interface ExercisesSelectedListener {
    void onExercisesSelected(List<Exercise> exercises);
}

public class ChildComponent {
    private ExercisesSelectedListener listener;

    public void setListener(ExercisesSelectedListener l) { this.listener = l; }

    public void confirm() {
        listener.onExercisesSelected(selectedExercises);  // emit
    }
}
```

### Sintaxis antigua (decorador @Output — ya NO se recomienda)

```ts
@Output() exercisesSelected = new EventEmitter<ExerciseTemplateResponse[]>();
```

---

## Bindings en el template — los corchetes y parentesis

### `[propiedad]` — Property binding (padre -> hijo)

```html
<app-child [name]="valor" />
<input [disabled]="isLoading" />
<div [class.active]="isActive" />
```

Los corchetes `[]` significan: "evalua la expresion de la derecha y pasala como valor".
Sin corchetes seria un string literal: `name="texto fijo"`.

### `(evento)` — Event binding (hijo -> padre)

```html
<button (click)="onSave()">Save</button>
<app-child (exercisesSelected)="handleExercises($event)" />
<input (input)="onType($event)" />
```

Los parentesis `()` significan: "cuando ocurra este evento, ejecuta este metodo".
`$event` contiene los datos del evento (lo que se emitio con `.emit()` o el evento DOM nativo).

### `[(ngModel)]` — Two-way binding (solo en template-driven forms)

```html
<input [(ngModel)]="name" />
```

Combina `[]` y `()`: lee el valor Y lo actualiza cuando cambia.
Es azucar sintactico para: `[ngModel]="name" (ngModelChange)="name = $event"`.

---

## `model()` — Two-way binding entre tus propios componentes

Cuando el hijo necesita **leer y tambien cambiar** un valor del padre (un toggle, un selector, un contador), en vez de un `input()` + un `output()` se usa `model()`:

```ts
// En el hijo
import { model } from '@angular/core';

export class DaySelectorComponent {
  selectedDay = model<string>('MONDAY');   // input + output en uno

  select(day: string): void {
    this.selectedDay.set(day);   // cambia el valor Y avisa al padre
  }
}
```

```html
<!-- En el padre: "banana in a box" [( )] con una signal -->
<app-day-selector [(selectedDay)]="day" />
```

```ts
// En el padre
day = signal('MONDAY');   // se actualiza solo cuando el hijo llama a set()
```

Por debajo, `model()` crea un input `selectedDay` y un output `selectedDayChange`.

> **Angular 22:** si un componente tiene un `model()` y un `output()` con el mismo nombre (por ejemplo `selectedDay` y `selectedDayChange`), ahora da error de compilacion. `ng update` lo migra solo.

---

## Resumen del flujo de datos

```
Padre                          Hijo
  |                              |
  |--- [input]="valor" -------->|   datos hacia abajo
  |                              |
  |<-- (output)="metodo($event)"|   eventos hacia arriba
  |                              |
```

Regla: los datos siempre bajan con `[]`, los eventos siempre suben con `()`.
Nunca al reves — un hijo no modifica datos del padre directamente.
La unica excepcion controlada es `model()` con `[( )]`, que es una forma corta de escribir un input + un output.

---

## Novedades de Angular 21-22 relacionadas

- **Error al leer un input obligatorio demasiado pronto** (Angular 21): leer un `input.required()` en el constructor o en la declaracion de un campo da error de compilacion. Leelo en `ngOnInit`, en un `computed()` o en el template.
- **Input enlazado dos veces** (Angular 22, error NG1054): si enlazas el mismo input dos veces en un elemento (por ejemplo, con su nombre y con su alias), ahora el error salta al compilar.
