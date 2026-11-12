import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CreateRoutineStateService } from '../../../core/services/create-routine-state.service';
import { CalendarComponent } from './calendar/calendar.component';
import { ProgramService } from '../../../core/services/program.service';
import { rxResource } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-dashboard',
  imports: [
    CalendarComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {

  private programService = inject(ProgramService);

  activeProgramResource = rxResource({
    loader: ({ }) =>
      this.programService.findActiveProgram()
  });

  programName = computed(() => {
    const data = this.activeProgramResource.value();
    if (data == null) {
      return '';
    }
    return data.name;
  })

  routines = computed(() => {
    const data = this.activeProgramResource.value();
    if (data == null) {
      return [];
    }
    return data.routines;
  })

}
