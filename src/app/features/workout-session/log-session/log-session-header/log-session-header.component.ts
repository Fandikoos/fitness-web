import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

// Componente "de presentación": solo pinta lo que recibe y avisa al padre
// con outputs. No sabe nada de servicios ni de cómo se guarda la sesión.
@Component({
  selector: 'app-log-session-header',
  imports: [],
  templateUrl: './log-session-header.component.html',
  styleUrl: './log-session-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogSessionHeaderComponent {

  routineName = input.required<string>();

  // Progreso de la sesión
  completedExercises = input.required<number>();
  totalExercises = input.required<number>();
  completedSets = input.required<number>();
  totalSets = input.required<number>();

  // El padre decide qué hacer: navegar, pedir confirmación, guardar...
  exit = output<void>();
  finish = output<void>();

}
