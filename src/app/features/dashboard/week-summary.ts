import { RoutineResponse } from '../../shared/interfaces/routine.interface';
import { LoggedSetResponse, WorkoutSessionResponse } from '../../shared/interfaces/workout-session.interface';
import { DAYS_OF_WEEK } from '../../shared/utils/days-of-week';
import { addDays, toIsoDate } from '../../shared/utils/dates';

// Estado de cada día en la tira semanal (L–D)
//   done    → hay al menos una sesión registrada ese día
//   missed  → día pasado con rutina planificada y sin sesión
//   today   → hoy, con rutina planificada y todavía sin sesión
//   planned → día futuro con rutina planificada
//   rest    → día sin rutina en el programa activo
export type WeekDayStatus = 'done' | 'missed' | 'today' | 'planned' | 'rest';

export interface WeekDay {
  date: Date;
  isToday: boolean;
  status: WeekDayStatus;
  // Rutina del programa para ese día de la semana (undefined = descanso)
  routine: RoutineResponse | undefined;
  // Sesiones registradas ese día (normalmente 0 o 1)
  sessions: WorkoutSessionResponse[];
}

export interface WeekStats {
  sessionsDone: number;
  sessionsPlanned: number;
  totalSets: number;
  // Σ kg × reps de todas las series de la semana
  totalVolumeKg: number;
}

// Construye los 7 días de la semana cruzando el plan (rutinas del programa)
// con lo realmente hecho (sesiones). Las fechas se comparan como "yyyy-MM-dd".
export function buildWeekDays(
  monday: Date,
  today: Date,
  routines: RoutineResponse[],
  sessions: WorkoutSessionResponse[],
): WeekDay[] {
  const todayIso = toIsoDate(today);

  return DAYS_OF_WEEK.map((dayOfWeek, index) => {
    const date = addDays(monday, index);
    const iso = toIsoDate(date);
    const routine = routines.find(r => r.dayOfWeek.toUpperCase() === dayOfWeek.value);
    const daySessions = sessions.filter(s => s.sessionDate === iso);

    // Los strings "yyyy-MM-dd" se ordenan igual que las fechas → se pueden comparar con < y >
    let status: WeekDayStatus;
    if (daySessions.length > 0) {
      status = 'done';
    } else if (!routine) {
      status = 'rest';
    } else if (iso < todayIso) {
      status = 'missed';
    } else if (iso === todayIso) {
      status = 'today';
    } else {
      status = 'planned';
    }

    return { date, isToday: iso === todayIso, status, routine, sessions: daySessions };
  });
}

export function buildWeekStats(routines: RoutineResponse[], sessions: WorkoutSessionResponse[]): WeekStats {
  return {
    sessionsDone: sessions.length,
    sessionsPlanned: routines.length,
    totalSets: sessions.reduce((total, s) => total + countSessionSets(s), 0),
    totalVolumeKg: sessions.reduce((total, s) => total + sessionVolumeKg(s), 0),
  };
}

export function countSessionSets(session: WorkoutSessionResponse): number {
  return session.exercises.reduce((total, e) => total + e.sets.length, 0);
}

export function sessionVolumeKg(session: WorkoutSessionResponse): number {
  return session.exercises
    .flatMap(e => e.sets)
    .reduce((total, set) => total + set.weightKg * set.reps, 0);
}

export function countRoutineSets(routine: RoutineResponse): number {
  return routine.exercises.reduce((total, e) => total + e.sets.length, 0);
}

// Mejor serie de un ejercicio: la de más peso y, a igual peso, la de más repeticiones.
// Si todas son sin peso (dominadas, fondos…) se resume como "series × reps máximas".
export function bestSetLabel(sets: LoggedSetResponse[]): string {
  if (sets.length === 0) {
    return '—';
  }
  const best = sets.reduce((a, b) =>
    b.weightKg > a.weightKg || (b.weightKg === a.weightKg && b.reps > a.reps) ? b : a,
  );
  return best.weightKg > 0
    ? `${best.weightKg} kg × ${best.reps}`
    : `${sets.length} × ${best.reps}`;
}
