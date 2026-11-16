import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

// Lo que necesita cada fila de la lista (modelo de vista, no viene del backend)
export interface ExerciseProgress {
  name: string;
  completedSets: number;
  totalSets: number;
}

@Component({
  selector: 'app-log-session-list-exercises',
  imports: [],
  templateUrl: './log-session-list-exercises.component.html',
  styleUrl: './log-session-list-exercises.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogSessionListExercisesComponent {

  // Un objeto por ejercicio: cada fila tiene sus propias series
  exercises = input.required<ExerciseProgress[]>();
  selectedIndex = input.required<number>();

  // Avisa al padre de qué ejercicio se ha pulsado (posición en la lista)
  selectExercise = output<number>();

}
