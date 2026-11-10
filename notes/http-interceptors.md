# Interceptores HTTP en Angular

---

## Que es un interceptor

Un interceptor es una funcion que se ejecuta **en todas las peticiones de `HttpClient`**,
antes de que salgan al backend y despues de que vuelva la respuesta.

Sirve para meter logica transversal (que afecta a todas las peticiones) en **un solo sitio**,
en vez de repetirla en cada servicio o componente.

### Analogia con Java

| Java / Spring | Angular |
|---|---|
| `Filter` de Servlet / `HandlerInterceptor` de Spring | `HttpInterceptorFn` |
| `chain.doFilter(req, res)` | `next(req)` |
| `@ControllerAdvice` / `GlobalExceptionHandler` | interceptor de errores |
| Interceptor de OkHttp / `ClientHttpRequestInterceptor` de RestTemplate | lo mas parecido: tambien es del lado **cliente** |

La diferencia con el `GlobalExceptionHandler`: alli conviertes una excepcion en un JSON de error.
Aqui haces lo contrario: recibes ese JSON y decides que mostrar al usuario.

### El flujo

```
Componente → Service.create() → HttpClient → [interceptor 1] → [interceptor 2] → Backend
                                                                                   │
Componente ← subscribe()     ←  HttpClient ← [interceptor 1] ← [interceptor 2] ←───┘
```

- La **peticion** atraviesa los interceptores en el orden del array.
- La **respuesta** vuelve en orden inverso (como una pila de filtros).

---

## Anatomia de un interceptor funcional

```ts
import { HttpInterceptorFn } from '@angular/common/http';

export const myInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. ANTES: aqui puedes leer o modificar la peticion (req)

  return next(req).pipe(
    // 2. DESPUES: aqui reaccionas a la respuesta o al error
  );
};
```

| Pieza | Que es |
|---|---|
| `HttpInterceptorFn` | El "tipo" de la funcion (como una interfaz funcional en Java: `BiFunction<Req, Next, Observable>`) |
| `req` | La peticion (`HttpRequest`). **Es inmutable** |
| `next(req)` | Pasa la peticion al siguiente interceptor (o al backend). Devuelve un `Observable` con la respuesta |
| `.pipe(...)` | Donde enganchas operadores RxJS para tratar la respuesta: `catchError`, `tap`, `finalize`, `retry`... |

### La peticion es inmutable

No puedes hacer `req.headers.set(...)`. Hay que **clonarla** (como un `record` de Java con un `withX()`):

```ts
const authReq = req.clone({
  setHeaders: { Authorization: `Bearer ${token}` },
});
return next(authReq);
```

### Se puede usar `inject()`

Angular ejecuta los interceptores funcionales dentro de un **contexto de inyeccion**,
asi que puedes inyectar servicios directamente (como un `@Autowired` local):

```ts
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  ...
};
```

Ojo: `inject()` debe llamarse **al principio de la funcion**, no dentro del `catchError`
ni de otra lambda que se ejecute mas tarde (para entonces el contexto de inyeccion ya no existe).

---

## Registrarlo

En `app.config.ts`:

```ts
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withFetch(),
      withInterceptors([errorInterceptor]),   // el orden del array importa
    ),
  ],
};
```

Si no se registra aqui, el interceptor **no se ejecuta nunca**, aunque el fichero exista.

### Funcional vs basado en clases

| Estilo antiguo (clases) | Estilo moderno (funcional) |
|---|---|
| `class X implements HttpInterceptor { intercept(req, next) {...} }` | `const x: HttpInterceptorFn = (req, next) => {...}` |
| Se registra con `{ provide: HTTP_INTERCEPTORS, useClass: X, multi: true }` | Se registra con `withInterceptors([x])` |
| `next.handle(req)` | `next(req)` |

En Angular 19 usamos **siempre el funcional**. Si ves `HTTP_INTERCEPTORS` en un import, es del estilo antiguo y sobra.

---

## Nuestro ejemplo: errores del backend → toast

### Las piezas

```
core/interceptors/error.interceptor.ts      → captura el error y extrae el mensaje
core/services/toast.service.ts              → guarda la lista de toasts en un signal
shared/components/toast-response/           → pinta los toasts (DaisyUI)
shared/interfaces/error-response.interface  → forma del JSON de error del backend
app.component.html                          → <app-toast-response /> una sola vez, fuera del router-outlet
```

### El contrato con el backend

El backend (Spring) devuelve siempre este DTO desde su `GlobalExceptionHandler`:

```java
public record ErrorResponse(int status, String error, String message,
                            @JsonInclude(NON_NULL) List<String> errors,
                            Instant timestamp, String path) {}
```

Que en TypeScript es:

```ts
export interface ErrorResponse {
  status: number;
  error: string;       // "Bad Request", "Conflict"...
  message: string;     // el mensaje concreto → es el que mostramos
  errors?: string[];   // opcional: NON_NULL hace que no venga si es null
  timestamp: string;   // Instant llega como texto ISO
  path: string;
}
```

### El interceptor

```ts
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      toastService.error(extractMessage(error));
      return throwError(() => error);   // ← relanzar SIEMPRE
    })
  );
};

function extractMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Cannot connect to the server. Please try again later.';
  }

  const body = error.error as ErrorResponse | null;

  if (body?.errors?.length) {
    return `${body.message}: ${body.errors.join(', ')}`;
  }
  return body?.message ?? 'Unexpected error. Please try again.';
}
```

Puntos clave:

- **`error.error`** es el **cuerpo** de la respuesta (el JSON del backend). `error.status` es el codigo HTTP.
- **`status === 0`** significa que no hubo respuesta: backend caido, CORS, sin red...
- **`as ErrorResponse`** es un cast **sin comprobacion en runtime** (no hay `ClassCastException`).
  Solo sirve para que el compilador nos ayude. Por eso siempre hay un mensaje por defecto con `??`.
- **`?.`** (optional chaining): si algo es `null`/`undefined` devuelve `undefined` en vez de petar (evita el NPE).
- **`??`** (nullish coalescing): "si lo de la izquierda es null/undefined, usa lo de la derecha".

### En los componentes

El interceptor ya muestra el error, asi que el componente **solo gestiona el exito**:

```ts
private toastService = inject(ToastService);

this.routineService.create(routine).subscribe({
  next: () => this.toastService.success('Routine created successfully!'),
  error: (error) => console.error('Error saving routine:', error), // el toast lo pone el interceptor
});
```

---

## Errores tipicos

### 1. No relanzar el error

```ts
catchError((error) => {
  toastService.error(...);
  return EMPTY;   // ❌ el error se "traga"
})
```

Si no haces `throwError(() => error)`, el `error:` del `subscribe` del componente **nunca se ejecuta**
y el componente cree que todo fue bien (por ejemplo, navega al siguiente paso).
Equivale en Java a un `catch (Exception e) { log(e); }` sin `throw e`.

### 2. Toast duplicado

Si el interceptor muestra el error **y** el componente tambien, salen dos toasts.
Regla: **errores → interceptor; exitos → componente**.

### 3. Olvidar registrarlo

Crear el fichero no basta: hay que añadirlo a `withInterceptors([...])` e importarlo en `app.config.ts`.

### 4. Servicios que reemplazan el error

```ts
catchError(() => throwError(() => new Error('Failed to fetch program')))
```

No rompe el interceptor (que actua antes, mas cerca de `HttpClient`), pero el componente recibe
un `Error` generico en vez del `HttpErrorResponse` con el status y el mensaje del backend.
Con un interceptor de errores, estos `catchError` en los servicios suelen sobrar.

### 5. Clases dinamicas en Tailwind

No relacionado con interceptores pero salio aqui: escribir `'alert-' + type` hace que Tailwind
no genere la clase. Usar el nombre completo (`'alert-success'`) en un `Record<ToastType, string>`.

---

## Cuando usar un interceptor (y cuando no)

### Si

| Caso | Que hace el interceptor |
|---|---|
| **Manejo global de errores** | `catchError` → toast / redirigir a login si 401 |
| **Autenticacion** | `req.clone({ setHeaders: { Authorization: ... } })` en cada peticion |
| **Loading global** | Contador en un signal: +1 antes de `next`, -1 en `finalize()` |
| **Logging / tiempos** | `tap()` y medir cuanto tarda cada peticion |
| **Reintentos** | `retry(2)` para errores de red |
| **Cabeceras comunes** | `Accept-Language`, `X-Correlation-Id`... |

### No

- Logica que solo afecta a **una** peticion concreta → va en el servicio o el componente.
- Transformar el modelo de datos de un endpoint (mapear DTOs) → va en el servicio.
- Cosas que no son HTTP (navegacion, estado de UI) → servicios / guards.

Regla rapida: **si te ves copiando el mismo `catchError`, `tap` o header en varios servicios, es un interceptor.**

---

## Recetas rapidas

### Interceptor de autenticacion

```ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  if (!token) return next(req);

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
```

### Loading global

```ts
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);
  loading.start();
  return next(req).pipe(finalize(() => loading.stop()));  // finalize = finally de Java
};
```

### Saltarse el interceptor en una peticion concreta

Con `HttpContextToken` (una especie de "atributo" de la peticion, como `request.setAttribute()` en Servlets):

```ts
// Definir el token (con valor por defecto false)
export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

// En el interceptor
if (req.context.get(SKIP_ERROR_TOAST)) {
  return next(req);
}

// En el servicio, para una peticion que gestiona su propio error
this.http.get(url, { context: new HttpContext().set(SKIP_ERROR_TOAST, true) });
```

---

## Resumen

1. Un interceptor es un **filtro** por el que pasan todas las peticiones de `HttpClient`.
2. Forma: `(req, next) => next(req).pipe(...)`. Antes de `next` → peticion. Dentro de `pipe` → respuesta.
3. `req` es inmutable → `req.clone({...})`.
4. `inject()` al principio de la funcion.
5. Registrar en `provideHttpClient(withInterceptors([...]))`. El orden importa.
6. En `catchError`, **relanzar** con `throwError(() => error)`.
7. Errores en el interceptor, exitos en el componente.
