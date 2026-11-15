import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RoutineResponse } from '../../../shared/interfaces/routine.interface';
import { MuscleGroupLabelPipe } from '../../../shared/pipes/muscle-group-label.pipe';
import { DayLabelPipe } from '../../../shared/pipes/day-label.pipe';

@Component({
  selector: 'app-summary-workout',
  imports: [
    MuscleGroupLabelPipe,
    DayLabelPipe
  ],
  templateUrl: './summary-workout.component.html',
  styleUrl: './summary-workout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryWorkoutComponent {

  // undefined = hoy no hay rutina (día de descanso)
  routine = input<RoutineResponse | undefined>();

  // Copiamos antes de ordenar: sort() modifica el array y el input no se debe tocar
  exercises = computed(() =>
    [...(this.routine()?.exercises ?? [])].sort((a, b) => a.orderInRoutine - b.orderInRoutine)
  );

  totalSets = computed(() =>
    this.exercises().reduce((total, exercise) => total + exercise.sets.length, 0)
  );
}
