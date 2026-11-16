import { ChangeDetectionStrategy, Component, computed, inject, input, numberAttribute, signal } from '@angular/core';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { LogSessionHeaderComponent } from './log-session-header/log-session-header.component';
import { RoutineService } from '../../../core/services/routine.service';
import { WorkoutSessionService } from '../../../core/services/workout-session.service';
import { ExerciseProgress, LogSessionListExercisesComponent } from './log-session-list-exercises/log-session-list-exercises.component';
import { LogSessionExerciseComponent } from './log-session-exercise/log-session-exercise.component';

@Component({
  selector: 'app-log-session',
  imports: [
    LogSessionHeaderComponent,
    LogSessionListExercisesComponent,
    LogSessionExerciseComponent
  ],
  templateUrl: './log-session.component.html',
  styleUrl: './log-session.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogSessionComponent {

  private router = inject(Router);
  private routineService = inject(RoutineService);
  private workoutSessionService = inject(WorkoutSessionService);

  // Llega del query param ?routineId=X gracias a withComponentInputBinding().
  // Los query params siempre son string: numberAttribute lo convierte a number.
  routineId = input.required({ transform: numberAttribute });

  // Posición (en plannedExercises) del ejercicio que se está registrando
  selectedIndex = signal(0);

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

  // Totales planificados para el progreso del header
  totalExercises = computed(() => this.plannedExercises().length);
  totalSets = computed(() =>
    this.plannedExercises().reduce((total, exercise) => total + exercise.sets.length, 0)
  );

  // Una fila por ejercicio para la lista lateral
  exercisesProgress = computed<ExerciseProgress[]>(() =>
    this.plannedExercises().map((exercise) => ({
      name: exercise.exerciseTemplate.name,
      // TODO: contar las series marcadas como hechas cuando exista el formulario
      completedSets: 0,
      totalSets: exercise.sets.length,
    }))
  );

  exit(): void {
    // TODO: pedir confirmación con confirm-dialog si hay series marcadas
    this.router.navigate(['/']);
  }

  finish(): void {
    // TODO: construir el WorkoutSessionRequest desde el formulario y hacer el POST
  }

}
