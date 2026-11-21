import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ProgramService } from '../../core/services/program.service';
import { WorkoutSessionService } from '../../core/services/workout-session.service';
import { getWeekRange, toIsoDate } from '../../shared/utils/dates';
import { ComingUpComponent } from './coming-up/coming-up.component';
import { LastSessionComponent } from './last-session/last-session.component';
import { RoutineExercisesComponent } from './routine-exercises/routine-exercises.component';
import { TodayCardComponent } from './today-card/today-card.component';
import { buildWeekDays, buildWeekStats } from './week-summary';
import { WeekStatsComponent } from './week-stats/week-stats.component';
import { WeekStripComponent } from './week-strip/week-strip.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    DatePipe,
    RouterLink,
    TodayCardComponent,
    WeekStatsComponent,
    WeekStripComponent,
    LastSessionComponent,
    ComingUpComponent,
    RoutineExercisesComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {

  private programService = inject(ProgramService);
  private workoutSessionService = inject(WorkoutSessionService);

  // Fecha de referencia: no cambia mientras la página está abierta
  readonly today = new Date();
  readonly week = getWeekRange(this.today);

  // Se despliega desde el botón "Ver ejercicios" de la tarjeta de hoy
  showExercises = signal(false);

  // ---- Recursos (GET) ----

  activeProgramResource = rxResource({
    stream: () => this.programService.findActiveProgram(),
  });

  // Sesiones de la semana en curso (lunes → domingo)
  weekSessionsResource = rxResource({
    stream: () =>
      this.workoutSessionService.getBetweenDates(toIsoDate(this.week.monday), toIsoDate(this.week.sunday)),
  });

  // ---- Estado derivado ----

  // value() lanza una excepción si la petición ha fallado: solo se lee cuando hasValue() es true
  activeProgram = computed(() => (this.activeProgramResource.hasValue() ? this.activeProgramResource.value() : null));

  routines = computed(() => this.activeProgram()?.routines ?? []);

  // Mientras cargan (o si fallan) usamos [], pero el template no pinta nada que dependa
  // de ellas hasta que weekSessionsResource.hasValue() es true
  weekSessions = computed(() => (this.weekSessionsResource.hasValue() ? this.weekSessionsResource.value() : []));

  // Los 7 días: cruce entre el plan (rutinas) y lo hecho (sesiones)
  weekDays = computed(() => buildWeekDays(this.week.monday, this.today, this.routines(), this.weekSessions()));

  todayDay = computed(() => this.weekDays().find(d => d.isToday)!);

  todayRoutine = computed(() => this.todayDay().routine);

  // Días que quedan de la semana (después de hoy)
  upcomingDays = computed(() => this.weekDays().filter(d => d.date > this.today));

  weekStats = computed(() => buildWeekStats(this.routines(), this.weekSessions()));

  // El backend devuelve las sesiones de más reciente a más antigua
  lastSession = computed(() => this.weekSessions()[0]);

  // Última vez que se hizo la rutina de hoy (puede ser de otra semana).
  // Si hoy es descanso, params devuelve undefined y no se hace la petición.
  todayRoutineLatestResource = rxResource({
    params: () => this.todayRoutine()?.id,
    stream: ({ params: routineId }) => this.workoutSessionService.getLatestByRoutine(routineId),
  });

  // undefined = cargando/sin dato · null = nunca se ha hecho · string = "yyyy-MM-dd"
  todayRoutineLastDate = computed(() => {
    const resource = this.todayRoutineLatestResource;
    if (!resource.hasValue()) {
      return undefined;
    }
    return resource.value()?.sessionDate ?? null;
  });
}
