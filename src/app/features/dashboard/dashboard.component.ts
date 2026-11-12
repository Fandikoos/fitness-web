import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProgramService } from '../../core/services/program.service';
import { getDayOfWeek } from '../../shared/utils/days-of-week';
import { CalendarComponent } from './calendar/calendar.component';
import { SummaryWorkoutComponent } from './summary-workout/summary-workout.component';

@Component({
  selector: 'app-dashboard',
  imports: [CalendarComponent, SummaryWorkoutComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {

  private programService = inject(ProgramService);

  activeProgramResource = rxResource({
    loader: () => this.programService.findActiveProgram(),
  });

  programName = computed(() => this.activeProgramResource.value()?.name ?? '');

  routines = computed(() => this.activeProgramResource.value()?.routines ?? []);

  // Rutina programada para hoy, o undefined si es día de descanso
  todayRoutine = computed(() => {
    const today = getDayOfWeek().value; // p. ej. 'THURSDAY'
    return this.routines().find(r => r.dayOfWeek.toUpperCase() === today);
  });
}
