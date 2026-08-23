import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { ExerciseService } from '../../../core/services/exercise.service';
import { ExerciseTemplateResponse } from '../../../shared/interfaces/exercise-template.interface';
import { PaginationComponent } from '../../../shared/components/pagination.component';

interface MuscleGroupTab {
  label: string;
  value: string;
}

const MUSCLE_GROUPS: MuscleGroupTab[] = [
  { label: 'Chest', value: 'CHEST' },
  { label: 'Back', value: 'BACK' },
  { label: 'Shoulders', value: 'SHOULDERS' },
  { label: 'Biceps', value: 'BICEPS' },
  { label: 'Triceps', value: 'TRICEPS' },
  { label: 'Quads', value: 'QUADRICEPS' },
  { label: 'Hamstrings', value: 'HAMSTRINGS' },
  { label: 'Glutes', value: 'GLUTES' },
  { label: 'Calves', value: 'CALVES' },
  { label: 'Abs', value: 'ABS' },
  { label: 'Forearms', value: 'FOREARMS' },
  { label: 'Traps', value: 'TRAPS' },
];

@Component({
  selector: 'app-list-exercises',
  templateUrl: './list-exercises.component.html',
  imports: [PaginationComponent],
  styleUrls: ['./list-exercises.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListExercisesComponent {

  private exerciseService = inject(ExerciseService);

  exercisesSelected = output<ExerciseTemplateResponse[]>();

  readonly muscleGroups = MUSCLE_GROUPS;
  activeMuscleGroup = signal<string>('CHEST');
  exercises = signal<ExerciseTemplateResponse[]>([]);
  selectedExercises = signal<Map<number, ExerciseTemplateResponse>>(new Map());
  loading = signal(false);
  error = signal<string | null>(null);

  currentPage = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  readonly selectionCount = computed(() => this.selectedExercises().size);

  private readonly pageSize = 8;
  private dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('exerciseDialog');

  open(): void {
    this.selectedExercises.set(new Map());
    this.activeMuscleGroup.set('CHEST');
    this.currentPage.set(0);
    this.loadExercises();
    this.dialogRef().nativeElement.showModal();
  }

  close(): void {
    this.dialogRef().nativeElement.close();
  }

  selectMuscleGroup(group: string): void {
    if (this.activeMuscleGroup() === group) return;
    this.activeMuscleGroup.set(group);
    this.currentPage.set(0);
    this.loadExercises();
  }

  toggleExercise(exercise: ExerciseTemplateResponse): void {
    this.selectedExercises.update(current => {
      const next = new Map(current);
      if (next.has(exercise.id)) {
        next.delete(exercise.id);
      } else {
        next.set(exercise.id, exercise);
      }
      return next;
    });
  }

  isSelected(id: number): boolean {
    return this.selectedExercises().has(id);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadExercises();
  }

  confirm(): void {
    const selected = Array.from(this.selectedExercises().values());
    this.exercisesSelected.emit(selected);
    this.close();
  }

  private loadExercises(): void {
    this.loading.set(true);
    this.error.set(null);
    this.exerciseService.getByMuscleGroup(
      this.currentPage(),
      this.pageSize,
      this.activeMuscleGroup()
    ).subscribe({
      next: (data) => {
        this.exercises.set(data.content);
        this.totalPages.set(data.totalPages);
        this.totalElements.set(data.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load exercises');
        this.loading.set(false);
      },
    });
  }
}
