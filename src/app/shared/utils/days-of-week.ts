export interface DayOfWeekOption {
  label: string;
  value: string;
}

// value = enum the backend expects; label = text shown in the UI
export const DAYS_OF_WEEK: DayOfWeekOption[] = [
  { label: 'Lunes', value: 'MONDAY' },
  { label: 'Martes', value: 'TUESDAY' },
  { label: 'Miércoles', value: 'WEDNESDAY' },
  { label: 'Jueves', value: 'THURSDAY' },
  { label: 'Viernes', value: 'FRIDAY' },
  { label: 'Sábado', value: 'SATURDAY' },
  { label: 'Domingo', value: 'SUNDAY' },
];
