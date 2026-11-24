import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RoutineResponse } from '../../../shared/interfaces/routine.interface';
import { parseIsoDate } from '../../../shared/utils/dates';
import { countRoutineSets } from '../week-summary';

@Component({
  selector: 'app-today-card',
  imports: [DatePipe, RouterLink],
  templateUrl: './today-card.component.html',
  styleUrl: './today-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // El padre le pone clases de grid (lg:col-span-2): el host tiene que ser un bloque
  host: { class: 'block' },
})
export class TodayCardComponent {

  // undefined = hoy es día de descanso
  routine = input<RoutineResponse | undefined>();

  // Fecha "yyyy-MM-dd" de la última vez que se hizo esta rutina.
  // undefined = todavía cargando · null = nunca se ha hecho
  lastDoneDate = input<string | null | undefined>();

  // model() = input + output: el padre usa [(exercisesVisible)] y ambos comparten el valor
  exercisesVisible = model(false);

  totalSets = computed(() => {
    const routine = this.routine();
    return routine ? countRoutineSets(routine) : 0;
  });

  // Se convierte a Date local para que DatePipe no cambie de día por la zona horaria
  lastDone = computed(() => {
    const date = this.lastDoneDate();
    return date ? parseIsoDate(date) : null;
  });

  toggleExercises() {
    this.exercisesVisible.update(visible => !visible);
  }
}
