import { ChangeDetectionStrategy, Component, computed, inject, input, LOCALE_ID, output } from '@angular/core';
import { DatePipe, DecimalPipe, formatNumber } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RoutineExerciseResponse } from '../../../../shared/interfaces/routine.interface';
import { LoggedExerciseResponse } from '../../../../shared/interfaces/workout-session.interface';
import { MuscleGroupLabelPipe } from '../../../../shared/pipes/muscle-group-label.pipe';
import { LoggedExerciseForm } from '../log-session.form';

@Component({
  selector: 'app-log-session-exercise',
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe, MuscleGroupLabelPipe],
  templateUrl: './log-session-exercise.component.html',
  styleUrl: './log-session-exercise.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogSessionExerciseComponent {

  private locale = inject(LOCALE_ID);

  // Lo planificado (nombre, grupo muscular, series objetivo)
  routineExercise = input.required<RoutineExerciseResponse>();
  // El FormGroup de ESTE ejercicio dentro del formulario del padre.
  // Es un objeto: lo que se escribe aquí modifica el formulario del padre.
  exerciseForm = input.required<LoggedExerciseForm>();
  // Lo registrado la última vez (null si nunca se ha hecho)
  lastTime = input<LoggedExerciseResponse | null>(null);
  lastSessionDate = input<string | null>(null);

  previousName = input<string | null>(null);
  nextName = input<string | null>(null);
  previous = output<void>();
  next = output<void>();

  // Añadir / quitar series: el FormArray es del padre, así que solo avisamos.
  // removeSet emite la posición de la serie dentro del FormArray
  addSet = output<void>();
  removeSet = output<number>();

  // Series de la última vez indexadas por numberSet, para la columna "Última vez"
  lastSetsByNumber = computed(() =>
    new Map((this.lastTime()?.sets ?? []).map((set) => [set.numberSet, set]))
  );

  lastTimeSummary = computed(() => {
    const lastTime = this.lastTime();
    return lastTime ? summarizeSets(lastTime.sets, this.locale) : null;
  });

  plannedSummary = computed(() => summarizeSets(this.routineExercise().sets, this.locale));

  // Diferencia de peso máximo planificado vs. última vez (el "+2 kg" del mockup)
  weightDiff = computed(() => {
    const lastSets = this.lastTime()?.sets ?? [];
    const plannedSets = this.routineExercise().sets;
    if (lastSets.length === 0 || plannedSets.length === 0) {
      return null;
    }
    const maxWeight = (sets: { weightKg: number }[]) => Math.max(...sets.map((set) => set.weightKg));
    const diff = maxWeight(plannedSets) - maxWeight(lastSets);
    return diff === 0 ? null : diff;
  });

}

// Resume una lista de series en una línea, como en el mockup:
// - todas iguales         → "3 × 28 kg × 10"
// - mismo peso            → "26 kg × 10 · 10 · 9"
// - pesos distintos       → "26 kg × 10 · 28 kg × 8"
function summarizeSets(sets: { numberSet: number; weightKg: number; reps: number }[], locale: string): string {
  if (sets.length === 0) {
    return 'Sin series';
  }

  const sorted = [...sets].sort((a, b) => a.numberSet - b.numberSet);
  const kg = (weight: number) => `${formatNumber(weight, locale, '1.0-2')} kg`;
  const sameWeight = sorted.every((set) => set.weightKg === sorted[0].weightKg);
  const sameReps = sorted.every((set) => set.reps === sorted[0].reps);

  if (sameWeight && sameReps) {
    return `${sorted.length} × ${kg(sorted[0].weightKg)} × ${sorted[0].reps}`;
  }
  if (sameWeight) {
    return `${kg(sorted[0].weightKg)} × ${sorted.map((set) => set.reps).join(' · ')}`;
  }
  return sorted.map((set) => `${kg(set.weightKg)} × ${set.reps}`).join(' · ');
}
