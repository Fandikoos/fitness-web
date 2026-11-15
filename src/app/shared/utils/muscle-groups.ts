export interface MuscleGroupOption {
  label: string;
  value: string;
}

// value = enum the backend expects; label = text shown in the UI
export const MUSCLE_GROUPS: MuscleGroupOption[] = [
  { label: 'Pecho', value: 'CHEST' },
  { label: 'Espalda', value: 'BACK' },
  { label: 'Hombros', value: 'SHOULDERS' },
  { label: 'Bíceps', value: 'BICEPS' },
  { label: 'Tríceps', value: 'TRICEPS' },
  { label: 'Cuádriceps', value: 'QUADRICEPS' },
  { label: 'Isquiotibiales', value: 'HAMSTRINGS' },
  { label: 'Glúteos', value: 'GLUTES' },
  { label: 'Gemelos', value: 'CALVES' },
  { label: 'Abdominales', value: 'ABS' },
  { label: 'Antebrazos', value: 'FOREARMS' },
  { label: 'Trapecio', value: 'TRAPS' },
];
