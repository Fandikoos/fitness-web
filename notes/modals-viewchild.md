# Modales y viewChild en Angular

---

## Modales con `<dialog>` nativo + DaisyUI

### Que es `<dialog>`

`<dialog>` es un elemento HTML nativo del navegador para crear modales.
No necesitas librerias externas. El navegador gestiona:

- El overlay oscuro (backdrop)
- El focus trap (Tab no sale del modal)
- Cerrar con la tecla Escape
- El z-index automatico

### Estructura basica con DaisyUI

```html
<!-- 1. El elemento dialog con una template reference variable -->
<dialog #myDialog class="modal">

  <!-- 2. El contenido del modal -->
  <div class="modal-box">
    <h3 class="text-lg font-bold">Titulo</h3>
    <p>Contenido del modal</p>

    <!-- 3. Botones de accion -->
    <div class="modal-action">
      <button class="btn btn-ghost" (click)="closeDialog()">Cancel</button>
      <button class="btn btn-primary" (click)="confirm()">Confirm</button>
    </div>
  </div>

  <!-- 4. Backdrop clickable para cerrar -->
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>

</dialog>
```

### Clases DaisyUI para modales

| Clase | Que hace |
|---|---|
| `modal` | Aplica estilos de modal al dialog (centrado, animacion, backdrop) |
| `modal-box` | El contenedor blanco/oscuro del contenido |
| `modal-action` | Alinea los botones de accion a la derecha |
| `modal-backdrop` | Area clickable detras del modal para cerrarlo |

### Como funciona el backdrop

```html
<form method="dialog" class="modal-backdrop">
  <button>close</button>
</form>
```

Truco de HTML: un `<form method="dialog">` dentro de un `<dialog>` cierra el dialog
al hacer submit. El backdrop ocupa toda la pantalla detras del modal-box,
asi que al clickar fuera se envia el form y se cierra.

---

## viewChild — acceder a elementos o componentes del template

### Que es

`viewChild` permite acceder desde TypeScript a:
- Elementos del DOM marcados con `#nombreReferencia`
- Instancias de componentes hijos

Es la forma signal-based (moderna) de `@ViewChild`.

### Acceder a un elemento DOM

```ts
import { viewChild, ElementRef } from '@angular/core';

export class MyComponent {
  // Busca en el template un elemento con #myDialog
  private dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('myDialog');

  open(): void {
    // .nativeElement da acceso al elemento DOM real
    this.dialogRef().nativeElement.showModal();
  }

  close(): void {
    this.dialogRef().nativeElement.close();
  }
}
```

Paso a paso:
1. En el template: `<dialog #myDialog>` — el `#` crea una referencia
2. En el .ts: `viewChild.required('myDialog')` — busca esa referencia
3. `ElementRef<HTMLDialogElement>` — dice que es un elemento `<dialog>` del DOM
4. `.nativeElement` — accede al elemento DOM real (como `document.getElementById()`)
5. `.showModal()` y `.close()` — metodos nativos de `<dialog>`

Equivalente en Java Swing:
```java
private JDialog dialog;
dialog.setVisible(true);   // showModal()
dialog.setVisible(false);  // close()
```

### Acceder a un componente hijo

```ts
import { viewChild } from '@angular/core';

export class ParentComponent {
  // Busca la instancia del componente hijo en el template
  private listExercises = viewChild.required(ListExercisesComponent);

  openModal(): void {
    // Llama directamente a un metodo publico del hijo
    this.listExercises().open();
  }
}
```

Aqui no se busca por `#referencia` sino por tipo de componente.
`viewChild.required(ListExercisesComponent)` devuelve la instancia del componente,
no el elemento DOM. Asi puedes llamar a sus metodos publicos.

### `viewChild` vs `viewChild.required`

| | `viewChild()` | `viewChild.required()` |
|---|---|---|
| Tipo devuelto | `Signal<T \| undefined>` | `Signal<T>` |
| Si no lo encuentra | Devuelve `undefined` | Lanza error |
| Cuando usarlo | Elementos condicionales (`@if`) | Elementos que siempre existen |

### Sintaxis antigua (decorador — ya NO se recomienda)

```ts
// Forma vieja
@ViewChild('myDialog') dialogRef!: ElementRef<HTMLDialogElement>;
@ViewChild(ListExercisesComponent) listExercises!: ListExercisesComponent;
```

---

## Template reference variables (`#`)

```html
<dialog #myDialog>
<input #nameInput>
<app-list-exercises #exerciseList>
```

El `#` crea una variable local en el template que apunta al elemento o componente.
Sirve para dos cosas:

### 1. Usar la referencia en el propio template

```html
<input #nameInput type="text" />
<button (click)="greet(nameInput.value)">Greet</button>
```

`nameInput.value` accede directamente al valor del input sin necesidad de TypeScript.

### 2. Acceder desde TypeScript con viewChild

```html
<dialog #myDialog>
```
```ts
private dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('myDialog');
```

El string `'myDialog'` debe coincidir con el nombre despues del `#`.

---

## Abrir/cerrar dialog — metodos nativos del DOM

```ts
dialogRef().nativeElement.showModal();  // abre como modal (con backdrop)
dialogRef().nativeElement.show();       // abre sin backdrop (como popup)
dialogRef().nativeElement.close();      // cierra
```

| Metodo | Que hace |
|---|---|
| `showModal()` | Abre con backdrop, focus trap, cierre con Escape |
| `show()` | Abre sin backdrop ni overlay (raro usarlo) |
| `close()` | Cierra el dialog |

---

## Patron completo: modal con seleccion

```
ParentComponent                    ModalComponent (hijo)
      |                                   |
      |-- viewChild(ModalComponent) ----->|
      |                                   |
      |-- llama a modal.open() --------->|  (abre el dialog)
      |                                   |
      |                        usuario selecciona ejercicios
      |                                   |
      |<-- output: exercisesSelected -----|  (emite al confirmar)
      |                                   |
      onExercisesSelected($event)         |  (padre recibe datos)
```

1. El padre tiene una referencia al hijo via `viewChild`
2. El padre llama a `open()` del hijo para abrir el modal
3. El usuario interactua dentro del modal
4. Al confirmar, el hijo emite los datos con `output`
5. El padre los recibe via event binding `(exercisesSelected)="..."`
