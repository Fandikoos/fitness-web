import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RoutineResponse } from '../../../../shared/interfaces/routine.interface';

interface CalendarDay {
  date: Date;
  routineName: string;
  isToday: boolean;
}

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

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

    // getDay(): Sunday = 0, Monday = 1... → number of days since Monday
    const daysSinceMonday = (this.todayDate.getDay() + 6) % 7;
    const monday = new Date(this.todayDate);
    // Sacamos del dia del lunes de la semana en la que estamos
    monday.setDate(this.todayDate.getDate() - daysSinceMonday);

    return DAYS_OF_WEEK.map((dayName, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);

      const routine = routines.find(r => r.dayOfWeek.toUpperCase() === dayName);

      return {
        date,
        routineName: routine?.name ?? 'Descanso',
        isToday: index === daysSinceMonday,
      };
    });
  });
}
