import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
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
  srcImageUrl = signal<string>('');

  readonly muscleGroups = MUSCLE_GROUPS;
  activeMuscleGroup = signal<string>('CHEST');
  selectedExercises = signal<Map<number, ExerciseTemplateResponse>>(new Map());

  currentPage = signal(0);
  readonly selectionCount = computed(() => this.selectedExercises().size);

  private readonly pageSize = 8;
  private dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('exerciseDialog');

  // --- AFTER (rxResource) ---
  exercisesResource = rxResource({
    request: () => ({
      muscleGroup: this.activeMuscleGroup(),
      page: this.currentPage(),
    }),
    loader: ({ request }) =>
      this.exerciseService.getByMuscleGroup(request.page, this.pageSize, request.muscleGroup),
  });

  exercises = computed(() => this.exercisesResource.value()?.content ?? []);
  totalPages = computed(() => this.exercisesResource.value()?.totalPages ?? 0);
  totalElements = computed(() => this.exercisesResource.value()?.totalElements ?? 0);
  // In the template: loading() -> exercisesResource.isLoading(), error() -> exercisesResource.error()

  open(): void {
    this.selectedExercises.set(new Map());
    this.activeMuscleGroup.set('CHEST');
    this.currentPage.set(0);
    // BEFORE: this.loadExercises(); — now rxResource reacts automatically to signal changes
    this.dialogRef().nativeElement.showModal();
  }

  close(): void {
    this.dialogRef().nativeElement.close();
  }

  selectMuscleGroup(group: string): void {
    if (this.activeMuscleGroup() === group) return;
    this.activeMuscleGroup.set(group);
    this.currentPage.set(0);
    // BEFORE: this.loadExercises(); — no longer needed
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
    
    this.srcImageUrl.update(current =>current === exercise.imageUrl ? '' : exercise.imageUrl ?? '');
  }

  isSelected(id: number): boolean {
    return this.selectedExercises().has(id);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  confirm(): void {
    const selected = Array.from(this.selectedExercises().values());
    this.exercisesSelected.emit(selected);
    this.close();
  }

    // --- BEFORE (manual signals + subscribe) ---
  // exercises = signal<ExerciseTemplateResponse[]>([]);
  // loading = signal(false);
  // error = signal<string | null>(null);
  // totalPages = signal(0);
  // totalElements = signal(0);
  //
  // private loadExercises(): void {
  //   this.loading.set(true);
  //   this.error.set(null);
  //   this.exerciseService.getByMuscleGroup(
  //     this.currentPage(),
  //     this.pageSize,
  //     this.activeMuscleGroup()
  //   ).subscribe({
  //     next: (data) => {
  //       this.exercises.set(data.content);
  //       this.totalPages.set(data.totalPages);
  //       this.totalElements.set(data.totalElements);
  //       this.loading.set(false);
  //     },
  //     error: () => {
  //       this.error.set('Failed to load exercises');
  //       this.loading.set(false);
  //     },
  //   });
  // }
}
