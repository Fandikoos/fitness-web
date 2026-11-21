import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RoutineResponse } from '../../../shared/interfaces/routine.interface';
import { MuscleGroupLabelPipe } from '../../../shared/pipes/muscle-group-label.pipe';

// Lista de ejercicios planificados de una rutina (con sus series)
@Component({
  selector: 'app-routine-exercises',
  imports: [MuscleGroupLabelPipe],
  templateUrl: './routine-exercises.component.html',
  styleUrl: './routine-exercises.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoutineExercisesComponent {

  routine = input.required<RoutineResponse>();

  // Copiamos antes de ordenar: sort() modifica el array y el input no se debe tocar
  exercises = computed(() =>
    [...this.routine().exercises].sort((a, b) => a.orderInRoutine - b.orderInRoutine),
  );
}
