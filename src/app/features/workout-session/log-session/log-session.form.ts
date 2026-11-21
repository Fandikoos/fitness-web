import { FormArray, FormControl, FormGroup } from '@angular/forms';

// Tipos del formulario de registro de sesión. Tienen la misma forma que
// LoggedExerciseRequest / LoggedSetRequest, salvo:
// - numberSet y orderInSession no son controles: salen de la posición en el FormArray.
// - done solo existe en la UI: sirve para el progreso y para filtrar al guardar.

export type LoggedSetForm = FormGroup<{
  weightKg: FormControl<number>;
  reps: FormControl<number>;
  rpe: FormControl<number | null>;
  done: FormControl<boolean>;
}>;

export type LoggedExerciseForm = FormGroup<{
  exerciseTemplateId: FormControl<number>;
  notes: FormControl<string>;
  sets: FormArray<LoggedSetForm>;
}>;
