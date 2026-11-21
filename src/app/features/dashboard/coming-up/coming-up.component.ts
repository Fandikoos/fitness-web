import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { countRoutineSets, WeekDay } from '../week-summary';

@Component({
  selector: 'app-coming-up',
  imports: [DatePipe],
  templateUrl: './coming-up.component.html',
  styleUrl: './coming-up.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ComingUpComponent {

  // Días que quedan de la semana (después de hoy), según el programa activo
  days = input.required<WeekDay[]>();

  // Función pura importada: el template solo puede usar miembros de la clase
  readonly countRoutineSets = countRoutineSets;
}
