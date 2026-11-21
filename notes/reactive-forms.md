# Reactive Forms en Angular

## Que son

Los reactive forms definen la estructura del formulario en TypeScript (no en el template).
Toda la logica (valores, validaciones, estado) vive en el `.ts`, y el template solo se vincula.

Angular ofrece dos enfoques de formularios:

| | Template-driven | Reactive |
|---|---|---|
| Donde se define | En el HTML con `ngModel` | En el TypeScript con `FormGroup`/`FormControl` |
| Modulo | `FormsModule` | `ReactiveFormsModule` |
| Ideal para | Formularios simples (login, contacto) | Formularios complejos, dinamicos |
| Testing | Dificil (depende del DOM) | Facil (puro TypeScript) |
| Validaciones | Directivas en el template (`required`, etc.) | Funciones en el TypeScript (`Validators.required`) |

**Recomendacion:** En este proyecto usamos reactive forms. Siguen siendo totalmente validos y soportados en Angular 22.

> **Angular 22 — Signal Forms:** existe un tercer enfoque, **Signal Forms** (`@angular/forms/signals`), experimental en Angular 21 y **estable en Angular 22**. El formulario se construye a partir de una signal en vez de con `FormGroup`. Hay un resumen al final de esta nota y en [angular-22-novedades.md](angular-22-novedades.md).

---

## Setup basico

### 1. Importar ReactiveFormsModule en el componente

```ts
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  imports: [ReactiveFormsModule],
  // ...
})
```

### 2. Crear el formulario con FormBuilder

```ts
private fb = inject(FormBuilder);

form = this.fb.nonNullable.group({
  name: ['', [Validators.required, Validators.minLength(3)]],
  email: ['', [Validators.required, Validators.email]],
  description: [''],
  isActive: [false],
});
```

- `inject(FormBuilder)` — inyecta el servicio sin usar constructor.
- `nonNullable` — al resetear, vuelve a los valores iniciales en vez de poner `null`.
- `group({...})` — crea un `FormGroup` (contenedor de controles).
- Cada propiedad: `[valorInicial, [validadores]]`.

### 3. Vincular en el template

```html
<form [formGroup]="form" (ngSubmit)="onSubmit()">

  <input type="text" formControlName="name" />

  <button type="submit">Enviar</button>
</form>
```

- `[formGroup]="form"` — conecta el `<form>` con el FormGroup del .ts.
- `formControlName="name"` — conecta el input con el control `name`.
- `(ngSubmit)` — se dispara al enviar (previene el submit nativo del navegador).

---

## Validaciones

### Validadores built-in

```ts
import { Validators } from '@angular/forms';

form = this.fb.nonNullable.group({
  name:     ['', [Validators.required]],
  email:    ['', [Validators.required, Validators.email]],
  age:      [0,  [Validators.required, Validators.min(18), Validators.max(120)]],
  username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
  website:  ['', [Validators.pattern(/^https?:\/\/.+/)]],
});
```

| Validador | Que hace |
|---|---|
| `Validators.required` | No puede estar vacio |
| `Validators.minLength(n)` | Minimo n caracteres |
| `Validators.maxLength(n)` | Maximo n caracteres |
| `Validators.min(n)` | Valor numerico minimo |
| `Validators.max(n)` | Valor numerico maximo |
| `Validators.email` | Formato email valido |
| `Validators.pattern(regex)` | Debe cumplir la expresion regular |

### Validador custom

```ts
import { AbstractControl, ValidationErrors } from '@angular/forms';

function noWhitespace(control: AbstractControl): ValidationErrors | null {
  const hasWhitespace = control.value?.trim().length === 0;
  return hasWhitespace ? { whitespace: true } : null;
}

// Usarlo:
form = this.fb.nonNullable.group({
  name: ['', [Validators.required, noWhitespace]],
});
```

Un validador custom es una funcion que recibe un `AbstractControl` y devuelve:
- `null` si es valido
- Un objeto `{ claveError: true }` si es invalido

---

## Mostrar errores en el template

```html
<input type="text" formControlName="name"
  class="input input-bordered w-full"
  [class.input-error]="form.controls.name.touched && form.controls.name.invalid"
/>

@if (form.controls.name.touched && form.controls.name.errors) {
  <p class="text-error text-sm">
    @if (form.controls.name.errors['required']) {
      Name is required
    } @else if (form.controls.name.errors['minlength']) {
      Minimum 3 characters
    }
  </p>
}
```

### Estados de un control

| Propiedad | Significado |
|---|---|
| `.value` | Valor actual del control |
| `.valid` | Pasa todas las validaciones |
| `.invalid` | No pasa alguna validacion |
| `.touched` | El usuario ha hecho focus y blur en el campo |
| `.untouched` | El usuario no ha interactuado aun |
| `.dirty` | El valor ha cambiado respecto al inicial |
| `.pristine` | El valor no ha cambiado |
| `.errors` | Objeto con los errores activos, o `null` si es valido |

### Patron comun: solo mostrar errores despues de tocar

```
touched && invalid  →  mostrar error visual
touched && errors   →  mostrar mensaje de error
```

Se usa `touched` para no mostrar errores nada mas cargar el formulario.

---

## Metodos utiles del formulario

```ts
// Marcar todos como tocados (para forzar errores al hacer submit)
this.form.markAllAsTouched();

// Obtener el valor completo
const data = this.form.value;
// { name: 'Pecho', email: '', description: '', isActive: false }

// Obtener el valor sin campos deshabilitados omitidos
const raw = this.form.getRawValue();

// Resetear a los valores iniciales
this.form.reset();

// Establecer valor de un control concreto
this.form.controls.name.setValue('Nuevo nombre');

// Parchear varios campos a la vez (sin tocar los demas)
this.form.patchValue({ name: 'Piernas', isActive: true });

// Deshabilitar un control
this.form.controls.email.disable();

// Habilitar un control
this.form.controls.email.enable();
```

---

## Submit del formulario

```ts
onSubmit(): void {
  // 1. Si es invalido, marcar todo como tocado y parar
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  // 2. Obtener los valores
  const data = this.form.getRawValue();

  // 3. Enviar al backend
  this.myService.save(data).subscribe({
    next: (response) => {
      console.log('Guardado:', response);
      this.form.reset();
    },
    error: (err) => {
      console.error('Error:', err);
    },
  });
}
```

---

## Deshabilitar el boton de submit

```html
<button type="submit" [disabled]="form.invalid">
  Save
</button>
```

`[disabled]` es un binding de propiedad: cuando `form.invalid` es `true`, el boton se desactiva.

---

## Inputs con tipos especificos

```html
<!-- Texto -->
<input type="text" formControlName="name" />

<!-- Numero -->
<input type="number" formControlName="age" />

<!-- Email -->
<input type="email" formControlName="email" />

<!-- Textarea -->
<textarea formControlName="description" rows="3"></textarea>

<!-- Checkbox -->
<input type="checkbox" formControlName="isActive" />

<!-- Select -->
<select formControlName="category">
  @for (cat of categories; track cat) {
    <option [value]="cat">{{ cat }}</option>
  }
</select>
```

---

## FormGroup vs FormControl vs FormArray

| Clase | Que es |
|---|---|
| `FormControl` | Un solo campo (input, checkbox, select) |
| `FormGroup` | Un grupo de controles (el formulario entero, o un sub-grupo) |
| `FormArray` | Una lista dinamica de controles (ej: lista de ejercicios) |

### Ejemplo FormArray

```ts
form = this.fb.nonNullable.group({
  name: ['', Validators.required],
  exercises: this.fb.array([]),  // empieza vacio
});

get exercises() {
  return this.form.controls.exercises;
}

addExercise(): void {
  this.exercises.push(this.fb.control('', Validators.required));
}

removeExercise(index: number): void {
  this.exercises.removeAt(index);
}
```

```html
@for (exercise of exercises.controls; track $index) {
  <div>
    <input [formControl]="exercise" />
    <button type="button" (click)="removeExercise($index)">Remove</button>
  </div>
}
<button type="button" (click)="addExercise()">Add exercise</button>
```

---

## FormArray anidado: caso real (registrar sesion)

Codigo en `features/workout-session/log-session/`. El formulario tiene **listas dentro de listas**: una sesion tiene N ejercicios y cada ejercicio tiene N series. Es la misma forma que el DTO `WorkoutSessionRequest`.

### Analogia con Java

| Angular | Java |
|---|---|
| `FormControl` | un atributo de un POJO (con validacion) |
| `FormGroup` | un POJO / `Map<String, Control>` (campos con nombre fijo) |
| `FormArray` | un `List<Control>` (longitud variable) |

### 1. El arbol

```
sessionForm (FormGroup)              → WorkoutSessionRequest
├── notes (FormControl)
└── exercises (FormArray)            → List<LoggedExerciseRequest>
    └── [i] FormGroup
        ├── exerciseTemplateId
        ├── notes
        └── sets (FormArray)         → List<LoggedSetRequest>
            └── [j] FormGroup
                ├── weightKg, reps, rpe
                └── done             ← solo UI, no se envia
```

`numberSet` y `orderInSession` **no son controles**: salen de la posicion en el `FormArray` al construir el request. Asi no se descuadran nunca.

### 2. Tipar el formulario

Para pasar un trozo del formulario a un componente hijo hace falta poder nombrar su tipo (`log-session.form.ts`):

```ts
export type LoggedSetForm = FormGroup<{
  weightKg: FormControl<number>;
  reps: FormControl<number>;
  rpe: FormControl<number | null>;
  done: FormControl<boolean>;
}>;

export type LoggedExerciseForm = FormGroup<{
  exerciseTemplateId: FormControl<number>;
  notes: FormControl<string>;
  sets: FormArray<LoggedSetForm>;
}>;
```

### 3. Construirlo a partir de datos (con `map`)

No se escribe a mano: se recorre lo planificado y por cada elemento se crea un grupo. Un metodo por nivel:

```ts
private buildSessionForm(exercises: RoutineExerciseResponse[]) {
  return this.fb.nonNullable.group({
    notes: ['', Validators.maxLength(500)],
    exercises: this.fb.array(exercises.map((e) => this.buildExerciseForm(e))),
  });
}

private buildExerciseForm(exercise: RoutineExerciseResponse): LoggedExerciseForm {
  return this.fb.nonNullable.group({
    exerciseTemplateId: [exercise.exerciseTemplate.id],
    notes: ['', Validators.maxLength(255)],
    sets: this.fb.array(exercise.sets.map((set) => this.buildSetForm(set))),
  });
}

private buildSetForm(set: ExerciseSetResponse): LoggedSetForm {
  return this.fb.nonNullable.group({
    weightKg: [set.weightKg, [Validators.required, Validators.min(0)]],
    reps: [set.reps, [Validators.required, Validators.min(0)]],
    // nonNullable no deja poner null: para un control que admite null se usa fb.control<T | null>
    rpe: this.fb.control<number | null>(null, [Validators.min(1), Validators.max(10)]),
    done: [false],
  });
}
```

Como los datos (la rutina) llegan de forma asincrona, el formulario se **deriva** con un `computed`: cuando llega la rutina se crea uno nuevo prellenado. Sin `effect`.

```ts
sessionForm = computed(() => this.buildSessionForm(this.plannedExercises()));
```

### 4. Pintarlo: cada directiva "baja un nivel"

```html
<article [formGroup]="exerciseForm()">            <!-- 1. FormGroup del ejercicio -->
  <div formArrayName="sets">                      <!-- 2. entra en el FormArray "sets" -->
    @for (set of exerciseForm().controls.sets.controls; track set; let i = $index) {
      <div [formGroupName]="i">                   <!-- 3. entra en la serie i -->
        <input type="number" formControlName="weightKg" />   <!-- 4. sets[i].weightKg -->
        <input type="checkbox" formControlName="done" />
      </div>
    }
  </div>
  <textarea formControlName="notes"></textarea>   <!-- vuelve al nivel del ejercicio -->
</article>
```

- Es como una ruta de carpetas: `exerciseForm → sets → [i] → weightKg`. Por eso `formControlName="weightKg"` puede repetirse en todas las filas.
- `formArrayName="sets"` sin corchetes (texto fijo); `[formGroupName]="i"` con corchetes (variable).
- Se recorre `.controls` y no `.value`: `.value` son solo datos (copia); `.controls` son los objetos vivos (valor + validacion + estado) a los que se conectan los inputs.
- Doble `.controls`: en un `FormGroup` es un **objeto** con nombres (`controls.sets`); en un `FormArray` es un **array** (`controls[0]`), que es lo que recorre el `@for`.

### 5. Pasar un trozo a un componente hijo

El padre es dueño del formulario completo y le pasa al hijo solo el `FormGroup` del ejercicio seleccionado:

```ts
// Padre
selectedExerciseForm = computed(() => this.sessionForm().controls.exercises.at(this.selectedIndex()));

// Hijo
exerciseForm = input.required<LoggedExerciseForm>();
```

El `FormGroup` es un objeto: lo que el hijo escribe modifica el formulario del padre (como pasar una referencia en Java). **No hace falta ningun output** para devolver los valores.

### 6. Reaccionar a los cambios en una app zoneless

El formulario **no es una signal**, asi que un `computed` no se entera si cambias un input. Hay que convertir su `valueChanges` (Observable) en signal:

```ts
private formValue = toSignal(
  toObservable(this.sessionForm).pipe(
    // si se crea un formulario nuevo, se deja de escuchar el anterior
    switchMap((form) => form.valueChanges.pipe(
      startWith(null),                  // emitir tambien el valor inicial
      map(() => form.getRawValue())     // valor completo y bien tipado
    ))
  ),
  { initialValue: null }
);

completedSets = computed(() =>
  this.formValue()?.exercises.reduce(
    (total, e) => total + e.sets.filter((s) => s.done).length, 0
  ) ?? 0
);
```

Los cambios **suben por el arbol**: al marcar `done` en una serie, emite el `valueChanges` del formulario raiz.

### 7. Del formulario al request

Un control que solo existe para la UI (`done`) se usa para filtrar y no se copia:

```ts
const value = this.sessionForm().getRawValue();

const exercises = value.exercises
  .map((exercise) => ({
    exerciseTemplateId: exercise.exerciseTemplateId,
    notes: exercise.notes.trim() || null,
    sets: exercise.sets
      .filter((set) => set.done)                       // solo las hechas
      .map((set, i) => ({ numberSet: i + 1, weightKg: set.weightKg, reps: set.reps, rpe: set.rpe })),
  }))
  .filter((exercise) => exercise.sets.length > 0)      // fuera los ejercicios vacios
  .map((exercise, i) => ({ ...exercise, orderInSession: i + 1 }));
```

- `getRawValue()` devuelve el valor completo (incluidos controles deshabilitados) y con tipos no opcionales; `.value` los marca todos como opcionales.
- Validar solo lo que se envia: `set.controls.done.value && set.invalid`.

### 8. `dirty` para "salir sin guardar"

`form.dirty` pasa a `true` en cuanto el usuario cambia cualquier control del arbol. Sirve para decidir si pedir confirmacion al salir sin llevar la cuenta a mano:

```ts
exit(): void {
  if (this.sessionForm().dirty) {
    this.exitDialog().open();
    return;
  }
  this.leave();
}
```

---

## Novedades de Angular 20-21 en reactive forms

- `markAllAsDirty()` (Angular 20): como `markAllAsTouched()`, pero marca los controles como "dirty".
- `FormArrayDirective` (Angular 21): permite que un `FormArray` sea el elemento raiz de un formulario (`<form [formArray]="...">`).

---

## Resumen rapido

1. Importar `ReactiveFormsModule` en el componente
2. Crear el form con `FormBuilder` + `Validators`
3. Vincular con `[formGroup]` y `formControlName`
4. Mostrar errores con `@if (control.touched && control.errors)`
5. En submit: verificar `form.invalid`, si no es valido `markAllAsTouched()`, si es valido enviar datos

---

## Para comparar: el mismo formulario con Signal Forms (Angular 22)

Solo para que te suene. **No hace falta migrar**: reactive forms siguen siendo estandar. La idea es que el modelo del formulario **es una signal** y las validaciones se declaran en un "schema":

```ts
import { form, required, minLength, FormField } from '@angular/forms/signals';

@Component({
  imports: [FormField],
  // ...
})
export class RoutineFormComponent {
  // 1. El modelo es una signal normal
  routine = signal({ name: '', description: '' });

  // 2. form() crea el arbol de campos y declara las validaciones
  routineForm = form(this.routine, (path) => {
    required(path.name, { message: 'El nombre es obligatorio' });
    minLength(path.name, 3, { message: 'Mínimo 3 caracteres' });
  });
}
```

```html
<!-- 3. En el template se enlaza cada input con [formField] -->
<input [formField]="routineForm.name" class="input" />

@if (routineForm.name().touched() && routineForm.name().invalid()) {
  @for (error of routineForm.name().errors(); track error.kind) {
    <p class="text-error text-sm">{{ error.message }}</p>
  }
}
```

| | Reactive Forms | Signal Forms |
|---|---|---|
| Modelo | `FormGroup` / `FormControl` | Una `signal()` con un objeto normal |
| Valor | `form.value` / `valueChanges` (Observable) | Es la propia signal: `routine()` |
| Estado | `control.valid`, `control.touched` (propiedades) | `field().valid()`, `field().touched()` (signals) |
| Validaciones | Array de `Validators` por control | Funciones en el schema: `required(path.name)` |
| Directiva | `formControlName` | `[formField]` |

> Los nombres (`form`, `required`, `minLength`, `FormField`, `[formField]`) estan comprobados contra `@angular/forms` 22.2 instalado en el proyecto. Ojo con tutoriales antiguos: en las primeras versiones experimentales la directiva se llamaba `[field]` y varias APIs cambiaron antes de ser estables.
