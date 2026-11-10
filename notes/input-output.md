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
