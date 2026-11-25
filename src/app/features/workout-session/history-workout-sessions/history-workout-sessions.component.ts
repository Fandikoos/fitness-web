import { DatePipe, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, LOCALE_ID, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { WorkoutSessionService } from '../../../core/services/workout-session.service';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { WorkoutSessionResponse } from '../../../shared/interfaces/workout-session.interface';
import { VolumePipe } from '../../../shared/pipes/volume.pipe';
import { addDays, getWeekRange, parseIsoDate, toIsoDate } from '../../../shared/utils/dates';
import { countSessionSets, sessionVolumeKg } from '../../dashboard/week-summary';

// Fila de la lista: la sesión + los datos ya calculados para el template
interface SessionRow {
  session: WorkoutSessionResponse;
  date: Date;
  // "martes 17 de noviembre" (para el aria-label y el diálogo de borrado)
  longDate: string;
  exercises: number;
  sets: number;
  volumeKg: number;
}

@Component({
  selector: 'app-history-workout-sessions',
  imports: [DatePipe, RouterLink, VolumePipe, ConfirmDialog],
  templateUrl: './history-workout-sessions.component.html',
  styleUrl: './history-workout-sessions.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryWorkoutSessionsComponent {

  private workoutSessionService = inject(WorkoutSessionService);
  private toastService = inject(ToastService);
  private locale = inject(LOCALE_ID);

  private deleteDialog = viewChild.required<ConfirmDialog>('deleteDialog');

  // Lunes de la semana actual: no se puede avanzar más allá (no hay sesiones futuras)
  private readonly currentMonday = getWeekRange().monday;

  // ---- Semana seleccionada ----

  // Siempre guarda el LUNES de la semana que se está viendo
  selectedWeek = signal<Date>(this.currentMonday);

  week = computed(() => getWeekRange(this.selectedWeek()));

  // Cuántas semanas atrás estamos (0 = esta semana).
  // Math.round absorbe la hora de diferencia de los cambios de horario (verano/invierno).
  weeksAgo = computed(() =>
    Math.round((this.currentMonday.getTime() - this.selectedWeek().getTime()) / (7 * 24 * 60 * 60 * 1000)),
  );

  isCurrentWeek = computed(() => this.weeksAgo() === 0);

  // "16 – 22 nov 2026", "30 nov – 6 dic 2026" o "29 dic 2025 – 4 ene 2026"
  rangeLabel = computed(() => {
    const { monday, sunday } = this.week();
    const startFormat =
      monday.getFullYear() !== sunday.getFullYear() ? 'd MMM y'
      : monday.getMonth() !== sunday.getMonth() ? 'd MMM'
      : 'd';
    return `${formatDate(monday, startFormat, this.locale)} – ${formatDate(sunday, 'd MMM y', this.locale)}`;
  });

  rangeHint = computed(() => {
    const weeks = this.weeksAgo();
    if (weeks === 0) {
      return 'Esta semana';
    }
    return weeks === 1 ? 'Semana pasada' : `Hace ${weeks} semanas`;
  });

  // ---- Datos ----

  // Cada vez que cambia selectedWeek cambian los params y rxResource vuelve a pedir los datos solo
  sessionsResource = rxResource({
    params: () => ({ start: toIsoDate(this.week().monday), end: toIsoDate(this.week().sunday) }),
    stream: ({ params }) => this.workoutSessionService.getBetweenDates(params.start, params.end),
  });

  // value() lanza una excepción si la petición ha fallado: solo se lee cuando hasValue() es true
  rows = computed<SessionRow[]>(() => {
    const sessions = this.sessionsResource.hasValue() ? this.sessionsResource.value() : [];
    return sessions.map(session => {
      const date = parseIsoDate(session.sessionDate);
      return {
        session,
        date,
        longDate: formatDate(date, "EEEE d 'de' MMMM", this.locale),
        exercises: session.exercises.length,
        sets: countSessionSets(session),
        volumeKg: sessionVolumeKg(session),
      };
    });
  });

  stats = computed(() => ({
    sessions: this.rows().length,
    sets: this.rows().reduce((total, r) => total + r.sets, 0),
    volumeKg: this.rows().reduce((total, r) => total + r.volumeKg, 0),
  }));

  // ---- Navegación entre semanas ----

  previousWeek(): void {
    this.selectedWeek.update(monday => addDays(monday, -7));
  }

  nextWeek(): void {
    if (!this.isCurrentWeek()) {
      this.selectedWeek.update(monday => addDays(monday, 7));
    }
  }

  goToCurrentWeek(): void {
    this.selectedWeek.set(this.currentMonday);
  }

  // ---- Borrado ----

  // Sesión que se va a borrar (la que se muestra en el diálogo de confirmación)
  pendingDelete = signal<SessionRow | null>(null);

  deleteMessage = computed(() => {
    const row = this.pendingDelete();
    if (!row) {
      return '';
    }
    return `Vas a borrar ${row.session.routineName} del ${row.longDate}, con todas sus series. No se puede deshacer.`;
  });

  askDelete(row: SessionRow): void {
    this.pendingDelete.set(row);
    this.deleteDialog().open();
  }

  confirmDelete(): void {
    const row = this.pendingDelete();
    if (!row) {
      return;
    }
    // Si falla, el errorInterceptor ya muestra el toast de error
    this.workoutSessionService.delete(row.session.id).subscribe(() => {
      this.toastService.success('Sesión eliminada');
      this.pendingDelete.set(null);
      this.sessionsResource.reload();
    });
  }
}
