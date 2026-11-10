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

**Recomendacion:** Usar reactive forms siempre. Es el estandar en Angular moderno.

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

## Resumen rapido

1. Importar `ReactiveFormsModule` en el componente
2. Crear el form con `FormBuilder` + `Validators`
3. Vincular con `[formGroup]` y `formControlName`
4. Mostrar errores con `@if (control.touched && control.errors)`
5. En submit: verificar `form.invalid`, si no es valido `markAllAsTouched()`, si es valido enviar datos
