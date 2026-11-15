import { ChangeDetectionStrategy, Component, effect, inject, input, OnInit, signal, viewChild } from '@angular/core';
import { ListExercisesComponent } from '../list-exercises/list-exercises.component';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ExerciseTemplateResponse } from '../../../shared/interfaces/exercise-template.interface';
import { RoutineExerciseRequest, RoutineExerciseResponse, RoutineRequest, RoutineResponse } from '../../../shared/interfaces/routine.interface';
import { RoutineService } from '../../../core/services/routine.service';
import { ToastService } from '../../../core/services/toast.service';
import { MuscleGroupLabelPipe } from '../../../shared/pipes/muscle-group-label.pipe';

@Component({
  selector: 'app-select-exercises',
  templateUrl: './select-exercises.component.html',
  styleUrls: ['./select-exercises.component.css'],
  imports: [
    ListExercisesComponent,
    ReactiveFormsModule,
    MuscleGroupLabelPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectExercisesComponent implements OnInit {

  private fb = inject(FormBuilder);
  private routineService = inject(RoutineService);
  private toastService = inject(ToastService);

  // dayOfWeek is the backend enum (e.g. MONDAY); dayLabel is what the user sees (e.g. Lunes)
  dayOfWeek = input.required<string>();
  dayLabel = input.required<string>();
  programId = input.required<number>();
  routines = input.required<RoutineResponse[]>();

  routineForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    day: ['', [Validators.required]],
    description: [''],
  });

  selectedExercises = signal<RoutineExerciseResponse[]>([]);
  private existingRoutineId = signal<number | null>(null);
  private prefilled = false;

  private listExercises = viewChild.required(ListExercisesComponent);

  constructor() {
    effect(() => {
      const routines = this.routines();
      if (routines.length > 0 && !this.prefilled) {
        this.prefillFromExistingRoutine();
      }
    });
  }

  ngOnInit(): void {
    this.routineForm.controls.day.setValue(this.dayLabel());
  }

  openExerciseModal(): void {
    this.listExercises().open(this.selectedExercises());
  }

  // The modal edits the whole list, so its result replaces the current one
  onExercisesSelected(exercises: RoutineExerciseResponse[]): void {
    this.selectedExercises.set(exercises);
  }

  removeExercise(index: number): void {
    this.selectedExercises.update(current => current.filter((_, i) => i !== index));
  }

  moveExercise(index: number, direction: 'up' | 'down'): void {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    this.selectedExercises.update(current => {
      const updated = [...current];
      [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
      return updated;
    });
  }

  isEditing(): boolean {
    return this.existingRoutineId() !== null;
  }

  onSubmit(): void {
    if (this.routineForm.invalid) {
      this.routineForm.markAllAsTouched();
      return;
    }

    const exercises: RoutineExerciseRequest[] = [];
    for (let i = 0; i < this.selectedExercises().length; i++) {
      const exercise = this.selectedExercises()[i];
      exercises.push({
        exerciseTemplateId: exercise.exerciseTemplate.id,
        orderInRoutine: i + 1,
        notes: exercise.notes,
        sets: exercise.sets.map(({ numberSet, weightKg, reps, rpe }) => ({ numberSet, weightKg, reps, rpe })),
      });
    }

    const routine: RoutineRequest = {
      name: this.routineForm.controls.name.value,
      dayOfWeek: this.dayOfWeek(),
      description: this.routineForm.controls.description.value,
      programId: this.programId(),
      exercises,
    };

    const routineId = this.existingRoutineId();

    const request$ = routineId !== null
      ? this.routineService.update(routineId, routine)
      : this.routineService.create(routine);

    request$.subscribe({
      next: (response) => {
        const action = routineId !== null ? 'actualizada' : 'creada';
        console.log(`Routine ${action} successfully:`, response);
        this.toastService.success(`¡Rutina ${action} correctamente!`);
        this.existingRoutineId.set(response.id);
      },
      error: (error) => {
        console.error('Error saving routine:', error);
      },
    });
  }

  private prefillFromExistingRoutine(): void {
    const existing = this.routines().find(
      r => r.dayOfWeek.toUpperCase() === this.dayOfWeek().toUpperCase()
    );

    if (!existing) return;

    this.prefilled = true;
    this.existingRoutineId.set(existing.id);
    this.routineForm.patchValue({
      name: existing.name,
      description: existing.description,
    });

    this.selectedExercises.set(
      [...existing.exercises].sort((a, b) => a.orderInRoutine - b.orderInRoutine)
    );
  }
}
