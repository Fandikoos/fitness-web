import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ProgramService } from '../../core/services/program.service';
import { getDayOfWeek } from '../../shared/utils/days-of-week';
import { CalendarComponent } from './calendar/calendar.component';
import { SummaryWorkoutComponent } from './summary-workout/summary-workout.component';

@Component({
  selector: 'app-dashboard',
  imports: [CalendarComponent, SummaryWorkoutComponent, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {

  private programService = inject(ProgramService);

  // Día que se está viendo en la semana; por defecto, hoy
  selectedDate = signal<Date>(new Date());

  activeProgramResource = rxResource({
    stream: () => this.programService.findActiveProgram(),
  });

  // value() lanza una excepción si la petición ha fallado: solo se lee cuando hasValue() es true.
  // Hoy el template ya comprueba el error antes, pero así el computed es seguro lo lea quien lo lea.
  activeProgram = computed(() => (this.activeProgramResource.hasValue() ? this.activeProgramResource.value() : null));

  programName = computed(() => this.activeProgram()?.name ?? '');

  routines = computed(() => this.activeProgram()?.routines ?? []);

  // Rutina del día seleccionado, o undefined si es día de descanso
  selectedRoutine = computed(() => {
    const selectedDay = getDayOfWeek(this.selectedDate()).value; // p. ej. 'THURSDAY'
    return this.routines().find(r => r.dayOfWeek.toUpperCase() === selectedDay);
  });

  handleSelectedDayOfWeek(date: Date) {
    this.selectedDate.set(date);
  }
}
