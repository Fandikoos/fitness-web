import { ChangeDetectionStrategy, Component, computed, inject, input, LOCALE_ID, numberAttribute, signal, viewChild } from '@angular/core';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { formatDate } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { LoggedExerciseRequest, LoggedSetRequest, WorkoutSessionRequest } from '../../../shared/interfaces/workout-session.interface';
import { Router } from '@angular/router';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { map, startWith, switchMap } from 'rxjs';
import { LogSessionHeaderComponent } from './log-session-header/log-session-header.component';
import { RoutineService } from '../../../core/services/routine.service';
import { WorkoutSessionService } from '../../../core/services/workout-session.service';
import { ExerciseProgress, LogSessionListExercisesComponent } from './log-session-list-exercises/log-session-list-exercises.component';
import { LogSessionExerciseComponent } from './log-session-exercise/log-session-exercise.component';
import { LoggedExerciseForm, LoggedSetForm } from './log-session.form';
import { RoutineExerciseResponse } from '../../../shared/interfaces/routine.interface';
import { ExerciseSetResponse } from '../../../shared/interfaces/exercise-set.interface';

@Component({
  selector: 'app-log-session',
  imports: [
    ReactiveFormsModule,
    LogSessionHeaderComponent,
    LogSessionListExercisesComponent,
    LogSessionExerciseComponent,
    ConfirmDialog
  ],
  templateUrl: './log-session.component.html',
  styleUrl: './log-session.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogSessionComponent {

  private router = inject(Router);
  private fb = inject(FormBuilder);
  private locale = inject(LOCALE_ID);
  private toastService = inject(ToastService);
  private routineService = inject(RoutineService);
  private workoutSessionService = inject(WorkoutSessionService);

  // Llega del query param ?routineId=X gracias a withComponentInputBinding().
  // Los query params siempre son string: numberAttribute lo convierte a number.
  routineId = input.required({ transform: numberAttribute });

  // Posición (en plannedExercises) del ejercicio que se está registrando
  selectedIndex = signal(0);

  // Diálogo "¿Salir sin guardar?" (está fuera de los @if, así que siempre existe)
  private exitDialog = viewChild.required<ConfirmDialog>('exitDialog');

  // true mientras se envía el POST: deshabilita "Finalizar" para no guardar dos veces
  saving = signal(false);

  routineResource = rxResource({
    params: () => ({
      routineId: this.routineId()
    }),

    stream: ({ params }) =>
      this.routineService.getById(params.routineId)
  });

  latestWorkoutSessionResource = rxResource({
    params: () => ({
      routineId: this.routineId()
    }),

    stream: ({ params }) =>
      this.workoutSessionService.getLatestByRoutine(params.routineId)
  });

  routine = computed(() => this.routineResource.hasValue() ? this.routineResource.value() : null);
  workoutSession = computed(() => this.latestWorkoutSessionResource.hasValue() ? this.latestWorkoutSessionResource.value() : null);

  // Ejercicios planificados en orden. Copiamos antes de ordenar: sort() modifica el array
  plannedExercises = computed(() =>
    [...(this.routine()?.exercises ?? [])].sort((a, b) => a.orderInRoutine - b.orderInRoutine)
  );

  // ---- Formulario ----

  // El formulario se DERIVA de la rutina: cuando llega (o se recarga), se crea
  // uno nuevo prellenado con lo planificado. Por eso es un computed y no un effect.
  sessionForm = computed(() => this.buildSessionForm(this.plannedExercises()));

  // El formulario no es una signal: para que los computed de progreso se enteren
  // de los cambios, convertimos su valueChanges en signal.
  // switchMap: si se crea un formulario nuevo, dejamos de escuchar el anterior.
  private formValue = toSignal(
    toObservable(this.sessionForm).pipe(
      switchMap((form) => form.valueChanges.pipe(
        startWith(null),
        map(() => form.getRawValue())
      ))
    ),
    { initialValue: null }
  );

  // ---- Ejercicio seleccionado ----

  selectedExercise = computed(() => this.plannedExercises()[this.selectedIndex()]);
  selectedExerciseForm = computed(() => this.sessionForm().controls.exercises.at(this.selectedIndex()));

  // Lo registrado la última vez para este ejercicio (se empareja por plantilla)
  selectedLastTime = computed(() =>
    this.workoutSession()?.exercises.find(
      (logged) => logged.exerciseTemplate.id === this.selectedExercise()?.exerciseTemplate.id
    ) ?? null
  );

  previousExerciseName = computed(() => this.plannedExercises()[this.selectedIndex() - 1]?.exerciseTemplate.name ?? null);
  nextExerciseName = computed(() => this.plannedExercises()[this.selectedIndex() + 1]?.exerciseTemplate.name ?? null);

  // ---- Progreso (header y lista lateral) ----

  // Series marcadas como hechas, una posición por ejercicio
  private completedSetsPerExercise = computed(() =>
    this.formValue()?.exercises.map((exercise) => exercise.sets.filter((set) => set.done).length) ?? []
  );

  // Series de cada ejercicio según el FORMULARIO (no lo planificado): así cuentan
  // las series que se añaden o quitan durante la sesión
  private totalSetsPerExercise = computed(() =>
    this.formValue()?.exercises.map((exercise) => exercise.sets.length) ?? []
  );

  totalExercises = computed(() => this.plannedExercises().length);
  totalSets = computed(() =>
    this.totalSetsPerExercise().reduce((total, sets) => total + sets, 0)
  );

  completedSets = computed(() =>
    this.completedSetsPerExercise().reduce((total, completed) => total + completed, 0)
  );

  // Un ejercicio está completado cuando todas sus series están hechas
  completedExercises = computed(() =>
    this.totalSetsPerExercise().filter((total, i) =>
      total > 0 && this.completedSetsPerExercise()[i] === total
    ).length
  );

  // Una fila por ejercicio para la lista lateral
  exercisesProgress = computed<ExerciseProgress[]>(() =>
    this.plannedExercises().map((exercise, i) => ({
      name: exercise.exerciseTemplate.name,
      completedSets: this.completedSetsPerExercise()[i] ?? 0,
      totalSets: this.totalSetsPerExercise()[i] ?? 0,
    }))
  );

  // ---- Añadir / quitar series ----

  // Añade una serie al final copiando kg y reps de la última (lo normal en una
  // serie extra o una dropset es partir de ahí). Sin series previas, empieza en 0.
  addSet(exerciseIndex: number): void {
    const sets = this.sessionForm().controls.exercises.at(exerciseIndex).controls.sets;
    const last = sets.length > 0 ? sets.at(sets.length - 1).getRawValue() : null;
    sets.push(this.buildSetForm({ weightKg: last?.weightKg ?? 0, reps: last?.reps ?? 0 }));
    // push() no marca el formulario como modificado: lo hacemos a mano para que
    // "Salir" pida confirmación antes de descartar los cambios
    sets.markAsDirty();
  }

  // removeAt() reindexa el FormArray: las series siguientes "suben" un número
  removeSet(exerciseIndex: number, setIndex: number): void {
    const sets = this.sessionForm().controls.exercises.at(exerciseIndex).controls.sets;
    sets.removeAt(setIndex);
    sets.markAsDirty();
  }

  exit(): void {
    // Si no has tocado nada no hay nada que perder: salimos directamente.
    // dirty = el usuario ha cambiado algún control (kg, reps, notas, hecha…)
    if (this.sessionForm().dirty) {
      this.exitDialog().open();
      return;
    }
    this.leave();
  }

  // Lo llama el diálogo al confirmar, o exit() si no hay cambios
  leave(): void {
    this.router.navigate(['/']);
  }

  finish(): void {
    const form = this.sessionForm();

    // Solo importan las series marcadas: si una sin marcar tiene un valor raro, da igual
    const hasInvalidDoneSet = form.controls.exercises.controls.some((exercise) =>
      exercise.controls.sets.controls.some((set) => set.controls.done.value && set.invalid)
    );
    if (hasInvalidDoneSet) {
      this.toastService.warning('Revisa los valores marcados en rojo antes de guardar');
      return;
    }

    const request = this.buildRequest();
    if (request.exercises.length === 0) {
      this.toastService.warning('Marca al menos una serie como hecha para guardar la sesión');
      return;
    }

    this.saving.set(true);
    this.workoutSessionService.create(request).subscribe({
      next: () => {
        this.toastService.success('¡Sesión registrada correctamente!');
        this.router.navigate(['/']);
      },
      // El errorInterceptor ya muestra el toast (p. ej. 409 si ya registraste hoy);
      // aquí solo reactivamos el botón para poder reintentar
      error: () => this.saving.set(false),
    });
  }

  // Convierte el formulario en lo que espera el backend (WorkoutSessionRequest)
  private buildRequest(): WorkoutSessionRequest {
    const value = this.sessionForm().getRawValue();

    const exercises: LoggedExerciseRequest[] = value.exercises
      // 1. Por cada ejercicio, nos quedamos solo con las series hechas y las numeramos
      //    de nuevo (1, 2, 3…) para que no queden huecos si te saltaste alguna
      .map((exercise) => ({
        exerciseTemplateId: exercise.exerciseTemplateId,
        notes: exercise.notes.trim() || null,
        sets: exercise.sets
          .filter((set) => set.done)
          .map((set, i): LoggedSetRequest => ({
            numberSet: i + 1,
            weightKg: set.weightKg,
            reps: set.reps,
            rpe: set.rpe,
          })),
      }))
      // 2. Fuera los ejercicios sin ninguna serie hecha (el backend exige al menos una)
      .filter((exercise) => exercise.sets.length > 0)
      // 3. orderInSession según el orden final, también sin huecos
      .map((exercise, i) => ({ ...exercise, orderInSession: i + 1 }));

    return {
      // Fecha local "yyyy-MM-dd". No usamos toISOString(): va en UTC y de
      // madrugada daría el día anterior
      sessionDate: formatDate(new Date(), 'yyyy-MM-dd', this.locale),
      routineId: this.routineId(),
      notes: value.notes.trim() || null,
      exercises,
    };
  }

  // ---- Construcción del formulario ----

  private buildSessionForm(exercises: RoutineExerciseResponse[]) {
    return this.fb.nonNullable.group({
      notes: ['', Validators.maxLength(500)],
      exercises: this.fb.array(exercises.map((exercise) => this.buildExerciseForm(exercise))),
    });
  }

  private buildExerciseForm(exercise: RoutineExerciseResponse): LoggedExerciseForm {
    return this.fb.nonNullable.group({
      exerciseTemplateId: [exercise.exerciseTemplate.id],
      notes: ['', Validators.maxLength(255)],
      sets: this.fb.array(
        [...exercise.sets]
          .sort((a, b) => a.numberSet - b.numberSet)
          .map((set) => this.buildSetForm(set))
      ),
    });
  }

  // Prellenado con lo planificado (o con la serie copiada en addSet).
  // Las validaciones replican las del backend (LoggedSetRequest)
  private buildSetForm(set: Pick<ExerciseSetResponse, 'weightKg' | 'reps'>): LoggedSetForm {
    return this.fb.nonNullable.group({
      weightKg: [set.weightKg, [Validators.required, Validators.min(0), Validators.max(999.99)]],
      reps: [set.reps, [Validators.required, Validators.min(0)]],
      // El RPE es cómo se ha sentido la serie: empieza vacío aunque haya uno planificado
      rpe: this.fb.control<number | null>(null, [Validators.min(1), Validators.max(10)]),
      done: [false],
    });
  }

}
