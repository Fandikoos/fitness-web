export interface DayOfWeekOption {
  label: string;
  value: string;
}

// value = enum que espera el backend; label = texto que se muestra en la UI
export const DAYS_OF_WEEK: DayOfWeekOption[] = [
  { label: 'Lunes', value: 'MONDAY' },
  { label: 'Martes', value: 'TUESDAY' },
  { label: 'Miércoles', value: 'WEDNESDAY' },
  { label: 'Jueves', value: 'THURSDAY' },
  { label: 'Viernes', value: 'FRIDAY' },
  { label: 'Sábado', value: 'SATURDAY' },
  { label: 'Domingo', value: 'SUNDAY' },
];

// Índice en DAYS_OF_WEEK para la fecha dada (lunes = 0 ... domingo = 6).
// Date.getDay() empieza en domingo = 0, así que lo desplazamos para empezar en lunes.
export function getDayOfWeekIndex(date: Date = new Date()): number {
  return (date.getDay() + 6) % 7;
}

// Opción (label + valor del enum) para la fecha dada, p. ej. { label: 'Jueves', value: 'THURSDAY' }
export function getDayOfWeek(date: Date = new Date()): DayOfWeekOption {
  return DAYS_OF_WEEK[getDayOfWeekIndex(date)];
}
