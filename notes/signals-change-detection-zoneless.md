# Signals, Change Detection y Zoneless

Este documento explica como se relacionan tres conceptos fundamentales de Angular: las signals, el sistema de change detection, y el futuro Zoneless. Entender esta relacion es clave para escribir componentes eficientes.

---

## Change Detection — como Angular actualiza el DOM

Angular no manipula el DOM directamente cada vez que cambias una variable. En su lugar, tiene un sistema llamado **change detection** que:

1. Detecta que algo pudo haber cambiado
2. Comprueba los componentes para ver si sus datos cambiaron
3. Actualiza el DOM solo donde sea necesario

### Analogia Java

```java
// Es como el patron Observer aplicado al renderizado
// Angular es el "observador" que vigila tus datos
// Cuando detecta un cambio, llama a "render()" en los componentes afectados

// Conceptualmente:
public class ChangeDetector implements DataObserver {
    @Override
    public void onDataChanged() {
        for (Component c : tree) {
            if (c.hasChanges()) {
                c.updateView();
            }
        }
    }
}
```

---

## Las dos estrategias de Change Detection

### 1. `ChangeDetectionStrategy.Default`

Angular revisa el componente en **cada ciclo de deteccion**, aunque nada haya cambiado.

```ts
@Component({
  // Sin especificar changeDetection = Default
  changeDetection: ChangeDetectionStrategy.Default,
})
export class MyComponent {
  name = 'Push-ups';
}
```

Flujo:
```
Evento (click, HTTP response, setTimeout) ocurre
  → Zone.js lo intercepta
  → Angular dispara change detection
  → Revisa TODOS los componentes con Default
  → Compara cada binding del template con su valor anterior
  → Actualiza el DOM si algo cambio
```

Problema: si tienes 100 componentes con Default, Angular los revisa todos en cada ciclo, aunque solo 1 haya cambiado.

### 2. `ChangeDetectionStrategy.OnPush`

Angular SOLO revisa el componente cuando:
- Un `@Input()` / `input()` recibe un nuevo valor (por referencia)
- Un evento del DOM ocurre dentro del componente (click, keyup, etc.)
- Se llama a `markForCheck()` manualmente
- Un Observable conectado con `async` pipe emite
- **Una signal que usa el template cambia** (Angular 17+)

```ts
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,  // siempre usar esto
})
export class MyComponent {
  exercises = signal<Exercise[]>([]);

  // Cuando exercises cambia via .set() o .update(),
  // Angular marca este componente para re-check automaticamente
}
```

Flujo con OnPush + signals:
```
exercises.set([...])
  → La signal notifica a Angular que cambio
  → Angular marca SOLO este componente como "dirty"
  → En el siguiente ciclo, solo revisa los componentes marcados
  → Actualiza el DOM de este componente
```

### Por que SIEMPRE usar OnPush

En tu proyecto ya lo usas en todos los componentes — perfecto. La razon:

| | Default | OnPush |
|---|---|---|
| Cuando revisa | Siempre, en cada ciclo | Solo cuando algo relevante cambia |
| Rendimiento | Lento con muchos componentes | Rapido — solo revisa lo necesario |
| Con signals | Funciona pero desperdicia checks | Funciona perfectamente |
| Futuro Angular | Se ira eliminando | Es el camino hacia Zoneless |

OnPush + signals es la combinacion ideal: la signal le dice a Angular exactamente cuando revisar, y OnPush asegura que no se revise de mas.

---

## Zone.js — el que conectaba todo (y ahora sobra)

### Que es Zone.js

Zone.js es una libreria que **parchea (monkey-patches) todas las APIs asincronas del navegador**:

```
addEventListener  → Zone.js parchea → Angular se entera de clicks
setTimeout        → Zone.js parchea → Angular se entera de timers
fetch/XHR         → Zone.js parchea → Angular se entera de HTTP
Promise.then      → Zone.js parchea → Angular se entera de promesas
```

Cada vez que cualquiera de estas APIs se ejecuta, Zone.js avisa a Angular: "algo asincrono paso". Angular entonces dispara change detection y revisa todos los componentes.

### El problema de Zone.js

1. **Es un martillo para clavar chinchetas** — parchea TODAS las APIs, incluso las que no cambian datos de Angular
2. **No sabe que cambio** — solo sabe que "algo paso"
3. **Es pesado** — parchear todas las APIs del navegador tiene coste
4. **Causa checks innecesarios** — un setTimeout que no cambia nada igual dispara change detection

```ts
// Ejemplo: esto dispara change detection INNECESARIAMENTE
setTimeout(() => {
  console.log('Solo un log, no cambio nada');
}, 1000);
// Zone.js: "setTimeout se ejecuto! Angular, revisa TODO!"
// Angular: *revisa 100 componentes para nada*
```

### Analogia Java

```java
// Zone.js es como si en Java pusieras un proxy AOP en
// TODOS los metodos de TODAS las clases del JDK,
// y cada vez que cualquier metodo se ejecuta, recorrieras
// todo el arbol de la UI buscando cambios.
//
// Funciona, pero es un desperdicio brutal.
```

---

## Zoneless Angular — el futuro sin Zone.js

### Que es Zoneless

Es Angular SIN Zone.js. En lugar de parchear APIs del navegador, Angular depende de las **signals** para saber cuando algo cambia.

### Como activar Zoneless (Angular 19+, experimental)

```ts
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    // provideZoneChangeDetection({ eventCoalescing: true }), // ANTES
    provideExperimentalZonelessChangeDetection(),              // AHORA
  ],
};
```

Y en `angular.json`, puedes quitar zone.js de los polyfills:

```json
{
  "polyfills": []    // ya no necesitas "zone.js"
}
```

### Como funciona Zoneless

```
Sin Zone.js:
  setTimeout(() => console.log('log'))
  → Nada pasa, Angular no se entera (ni tiene por que)

Con signal:
  this.count.set(5)
  → La signal notifica a Angular directamente
  → Angular marca el componente como dirty
  → Solo re-renderiza ese componente
```

La signal ES la notificacion. No necesitas a Zone.js de intermediario.

### Que se necesita para funcionar sin Zone.js

Todo lo que cambia estado que se muestra en el template debe ser una **signal**:

```ts
// FUNCIONA en Zoneless — es una signal
exercises = signal<Exercise[]>([]);

loadExercises(): void {
  this.http.get<Exercise[]>('/api/exercises').subscribe(data => {
    this.exercises.set(data);  // la signal notifica a Angular
  });
}
```

```ts
// NO FUNCIONA en Zoneless — es una variable normal
exercises: Exercise[] = [];

loadExercises(): void {
  this.http.get<Exercise[]>('/api/exercises').subscribe(data => {
    this.exercises = data;  // Angular no se entera del cambio
    // Con Zone.js se enteraba porque parcheaba subscribe()
    // Sin Zone.js, el template nunca se actualiza
  });
}
```

### Que pasa con los eventos del template

Los eventos del template (`(click)`, `(input)`, etc.) siguen funcionando sin Zone.js porque Angular los registra directamente — no dependen de Zone.js:

```html
<!-- Esto siempre funciona, con o sin Zone.js -->
<button (click)="increment()">+1</button>
```

Cuando Angular registra `(click)`, el propio framework sabe que debe revisar el componente despues de ejecutar `increment()`.

### Que pasa con async/setTimeout/setInterval

Sin Zone.js, estas APIs ya no disparan change detection automaticamente:

```ts
// Con Zone.js: dispara change detection
// Sin Zone.js: NO dispara change detection
setTimeout(() => {
  this.name = 'new value';  // el template NO se actualiza
}, 1000);

// Solucion: usar signals
setTimeout(() => {
  this.name.set('new value');  // la signal notifica → el template SI se actualiza
}, 1000);
```

---

## El camino: Zone.js → OnPush + Signals → Zoneless

```
Angular < 16:   Zone.js + Default → revisa todo, siempre
Angular 16-18:  Zone.js + OnPush + Signals → revisa solo lo marcado
Angular 19+:    Zoneless + Signals → sin Zone.js, todo via signals
```

Cada paso elimina trabajo innecesario:

```
Default + Zone.js
  Evento → Zone.js → revisa TODOS los componentes → actualiza DOM
  Carga: maxima

OnPush + Zone.js + Signals
  Signal cambia → marca componente → revisa SOLO ese → actualiza DOM
  Carga: baja (pero Zone.js sigue parcheando todo)

Zoneless + Signals
  Signal cambia → marca componente → revisa SOLO ese → actualiza DOM
  Carga: minima (Zone.js eliminado, sin parches)
```

### Tu proyecto ya esta preparado

Tu proyecto ya sigue las practicas correctas para Zoneless:

```ts
// ✓ OnPush en todos los componentes
changeDetection: ChangeDetectionStrategy.OnPush

// ✓ Estado con signals
exercises = signal<ExerciseTemplateResponse[]>([]);
loading = signal(false);
error = signal<string | null>(null);

// ✓ inputs basados en signals
dayOfWeek = input.required<string>();
programId = input.required<number>();

// ✓ Estado compartido con signals en servicios
@Injectable({ providedIn: 'root' })
export class CreateRoutineStateService {
  programId = signal<number | null>(null);
}
```

Cuando Zoneless sea estable, solo tendrias que cambiar el provider en `app.config.ts` y quitar zone.js de los polyfills.

---

## OnPush en detalle — las 5 condiciones que disparan change detection

Con `ChangeDetectionStrategy.OnPush`, un componente se revisa SOLO cuando ocurre alguna de estas:

### 1. Un input recibe un valor nuevo (por referencia)

```ts
// Padre
name = signal('Push-ups');

// Template del padre
<app-child [title]="name()" />

// Cuando name cambia, el input del hijo recibe un nuevo valor
// → Angular revisa el hijo
```

### 2. Un evento del DOM ocurre dentro del componente

```html
<!-- Dentro del componente -->
<button (click)="doSomething()">Click</button>
<!-- El click dispara change detection para este componente -->
```

### 3. Una signal que lee el template cambia

```ts
count = signal(0);
// En el template: {{ count() }}

increment(): void {
  this.count.update(c => c + 1);
  // → la signal notifica → Angular revisa el componente
}
```

### 4. El async pipe recibe un nuevo valor

```ts
data$ = this.http.get<Data[]>('/api/data');
```
```html
@if (data$ | async; as data) {
  {{ data.length }}
}
```

### 5. markForCheck() se llama manualmente

```ts
private cdr = inject(ChangeDetectorRef);

someCallback(): void {
  this.regularProperty = 'new value';  // no es signal
  this.cdr.markForCheck();  // fuerza la revision
}
```

Con signals, casi nunca necesitas `markForCheck()` — las signals lo hacen automaticamente.

---

## Tabla resumen: signals, change detection y Zone.js

| Concepto | Rol | Futuro |
|---|---|---|
| **Zone.js** | Detecta que "algo asincrono paso" | Se eliminara (Zoneless) |
| **Change Detection** | Recorre componentes buscando cambios | Seguira existiendo pero mas eficiente |
| **Default strategy** | Revisa el componente en cada ciclo | No recomendado, se ira eliminando |
| **OnPush strategy** | Revisa solo cuando hay razon concreta | Estandar actual, compatible con Zoneless |
| **Signals** | Notifican exactamente que cambio | El mecanismo principal de reactividad |
| **Zoneless** | Angular sin Zone.js, solo signals | Experimental en 19, estable pronto |

### La relacion entre los tres

```
Signals           →  Le dicen a Angular QUE cambio
Change Detection  →  El sistema que ACTUALIZA el DOM cuando algo cambio
Zone.js           →  El viejo sistema para DISPARAR change detection
Zoneless          →  Dejar que las signals DISPAREN change detection directamente
```

Las signals no reemplazan el change detection — reemplazan a Zone.js como mecanismo de disparo. El change detection sigue siendo el que recorre el arbol de componentes y actualiza el DOM, pero ahora sabe exactamente donde mirar gracias a las signals.
