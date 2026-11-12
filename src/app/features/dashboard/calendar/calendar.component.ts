import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RoutineResponse } from '../../../shared/interfaces/routine.interface';
import { DAYS_OF_WEEK, getDayOfWeekIndex } from '../../../shared/utils/days-of-week';

interface CalendarDay {
  date: Date;
  routineName: string;
  isToday: boolean;
}

@Component({
  selector: 'app-calendar',
  imports: [DatePipe],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarComponent {

  programName = input.required<string>();
  routines = input<RoutineResponse[]>([]);

  readonly todayDate = new Date();

  weekDays = computed<CalendarDay[]>(() => {
    const routines = this.routines();

    // Lunes = 0 ... domingo = 6 → también son los días que han pasado desde el lunes
    const daysSinceMonday = getDayOfWeekIndex(this.todayDate);
    const monday = new Date(this.todayDate);
    // Lunes de la semana actual
    monday.setDate(this.todayDate.getDate() - daysSinceMonday);

    return DAYS_OF_WEEK.map((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);

      const routine = routines.find(r => r.dayOfWeek.toUpperCase() === day.value);

      return {
        date,
        routineName: routine?.name ?? 'Descanso',
        isToday: index === daysSinceMonday,
      };
    });
  });
}
