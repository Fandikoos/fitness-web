import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { countSessionSets, WeekDay, WeekDayStatus } from '../week-summary';

// Lo que necesita pintar cada casilla de la tira
interface WeekStripItem extends WeekDay {
  title: string;
  detail: string;
}

// Texto de apoyo de cada estado (también se usa para el aria-label del icono)
const STATUS_LABELS: Record<WeekDayStatus, string> = {
  done: 'Entrenado',
  missed: 'No entrenado',
  today: 'Hoy',
  planned: 'Planificado',
  rest: 'Descanso',
};

@Component({
  selector: 'app-week-strip',
  imports: [DatePipe],
  templateUrl: './week-strip.component.html',
  styleUrl: './week-strip.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekStripComponent {

  days = input.required<WeekDay[]>();

  readonly statusLabels = STATUS_LABELS;

  items = computed<WeekStripItem[]>(() =>
    this.days().map(day => {
      if (day.status === 'done') {
        const sets = day.sessions.reduce((total, s) => total + countSessionSets(s), 0);
        return {
          ...day,
          // El nombre de lo que se hizo de verdad (puede no coincidir con lo planificado)
          title: day.sessions.map(s => s.routineName).join(' + '),
          detail: `${sets} ${sets === 1 ? 'serie' : 'series'}`,
        };
      }
      return {
        ...day,
        title: day.routine?.name ?? 'Descanso',
        detail: day.isToday && day.status === 'rest' ? 'Hoy' : STATUS_LABELS[day.status],
      };
    }),
  );

  // Si la semana cruza dos meses se muestra "30 nov – 6 dic"; si no, "2 – 8 nov"
  sameMonth = computed(() => {
    const days = this.days();
    return days[0].date.getMonth() === days[days.length - 1].date.getMonth();
  });
}
