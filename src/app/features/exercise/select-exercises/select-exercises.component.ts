import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal, viewChild } from '@angular/core';
import { ListExercisesComponent } from '../list-exercises/list-exercises.component';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ExerciseTemplateRequest, ExerciseTemplateResponse } from '../../../shared/interfaces/exercise-template.interface';
import { RoutineExerciseRequest, RoutineRequest } from '../../../shared/interfaces/routine.interface';
import { RoutineService } from '../../../core/services/routine.service';

@Component({
  selector: 'app-select-exercises',
  templateUrl: './select-exercises.component.html',
  styleUrls: ['./select-exercises.component.css'],
  imports: [
    ListExercisesComponent,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectExercisesComponent implements OnInit {

  private fb = inject(FormBuilder);
  private routineService = inject(RoutineService);

  dayOfWeek = input.required<string>();
  programId = input.required<number>();

  routineForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    day: ['', [Validators.required]],
    description: [''],
  });

  selectedExercises = signal<ExerciseTemplateResponse[]>([]);

  private listExercises = viewChild.required(ListExercisesComponent);

  ngOnInit(): void {
    this.routineForm.controls.day.setValue(this.dayOfWeek());
  }

  openExerciseModal(): void {
    this.listExercises().open();
  }

  onExercisesSelected(exercises: ExerciseTemplateResponse[]): void {
    // Array con los posibles elementos antiguos + los nuevos elementos seleccionados
    this.selectedExercises.update(current => [...current, ...exercises]);
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

  onSubmit(): void {
    if (this.routineForm.invalid) {
      this.routineForm.markAllAsTouched();
      return;
    }

    const exercises: RoutineExerciseRequest[] = [];
    for (let i = 0; i < this.selectedExercises().length; i++) {
      exercises.push({
        exerciseTemplateId: this.selectedExercises()[i].id,
        order: i + 1,
        notes: '',
        sets: [],
      });
    }

    const routine: RoutineRequest = {
      name: this.routineForm.controls.name.value,
      dayOfWeek: this.routineForm.controls.day.value.toUpperCase(),
      description: this.routineForm.controls.description.value,
      programId: this.programId(),
      exercises,
    };
    this.routineService.create(routine).subscribe({
      next: (response) => {
        console.log('Routine created successfully:', response);
        window.alert('Routine created successfully!');
      },
      error: (error) => {
        console.error('Error creating routine:', error);
        window.alert('Failed to create routine. Please try again later.');
      },
    });
  }
}
