import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ExerciseService } from '../../../core/services/exercise.service';
import { ExerciseTemplateResponse } from '../../../shared/interfaces/exercise-template.interface';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { RoutineExerciseRequest, RoutineExerciseResponse } from '../../../shared/interfaces/routine.interface';

interface MuscleGroupTab {
  label: string;
  value: string;
}

// Weight and reps stay null while the user has not typed them yet
interface SetDraft {
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
}

interface ExerciseDraft {
  id?: number;
  exerciseTemplate: ExerciseTemplateResponse;
  notes: string;
  sets: SetDraft[];
}

// Matches the backend column: precision = 5, scale = 2
const MAX_WEIGHT_KG = 999.99;

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
  imports: [FormsModule, PaginationComponent],
  styleUrls: ['./list-exercises.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListExercisesComponent {

  private exerciseService = inject(ExerciseService);

  exercisesSelected = output<RoutineExerciseResponse[]>();

  readonly muscleGroups = MUSCLE_GROUPS;
  activeMuscleGroup = signal<string>('CHEST');
  selectedExercises = signal<Map<number, ExerciseDraft>>(new Map());
  private brokenImages = signal<Set<number>>(new Set());

  currentPage = signal(0);
  readonly selection = computed(() => Array.from(this.selectedExercises().values()));
  readonly selectionCount = computed(() => this.selectedExercises().size);
  readonly canConfirm = computed(() =>
    this.selectionCount() > 0 &&
    this.selection().every(draft => draft.sets.every(set => this.isSetValid(set)))
  );

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

  open(current: RoutineExerciseResponse[] = []): void {
    this.selectedExercises.set(new Map(
      current.map(exercise => [exercise.exerciseTemplate.id, this.toDraft(exercise)])
    ));
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
        next.set(exercise.id, { exerciseTemplate: exercise, notes: '', sets: [] });
      }
      return next;
    });
  }

  isSelected(id: number): boolean {
    return this.selectedExercises().has(id);
  }

  updateNotes(exerciseId: number, notes: string): void {
    this.updateDraft(exerciseId, draft => ({ ...draft, notes }));
  }

  // New sets start from the previous one, since sets are usually similar
  addSet(exerciseId: number): void {
    this.updateDraft(exerciseId, draft => {
      const lastSet = draft.sets.at(-1);
      const newSet: SetDraft = lastSet ? { ...lastSet } : { weightKg: null, reps: null, rpe: null };
      return { ...draft, sets: [...draft.sets, newSet] };
    });
  }

  updateSet(exerciseId: number, setIndex: number, changes: Partial<SetDraft>): void {
    this.updateDraft(exerciseId, draft => ({
      ...draft,
      sets: draft.sets.map((set, i) => i === setIndex ? { ...set, ...changes } : set),
    }));
  }

  removeSet(exerciseId: number, setIndex: number): void {
    this.updateDraft(exerciseId, draft => ({
      ...draft,
      sets: draft.sets.filter((_, i) => i !== setIndex),
    }));
  }

  hasInvalidWeight(set: SetDraft): boolean {
    return set.weightKg !== null && (set.weightKg < 0 || set.weightKg > MAX_WEIGHT_KG);
  }

  hasInvalidReps(set: SetDraft): boolean {
    return set.reps !== null && (set.reps < 1 || !Number.isInteger(set.reps));
  }

  hasInvalidRpe(set: SetDraft): boolean {
    return set.rpe !== null && (set.rpe < 1 || set.rpe > 10 || !Number.isInteger(set.rpe));
  }

  hasBrokenImage(exerciseId: number): boolean {
    return this.brokenImages().has(exerciseId);
  }

  markImageAsBroken(exerciseId: number): void {
    this.brokenImages.update(current => new Set(current).add(exerciseId));
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  confirm(): void {
    const selected = this.selection();
    const routineExerciseResponseToCreate: RoutineExerciseResponse[] = [];

    for (let i = 0; i < selected.length; i++) {
      const draft = selected[i];
      routineExerciseResponseToCreate.push({
        id: draft.id,
        exerciseTemplate: draft.exerciseTemplate,
        orderInRoutine: i + 1,
        notes: draft.notes.trim(),
        // The "!" is safe: canConfirm() blocks this method while weight or reps are null
        sets: draft.sets.map((set, setIndex) => ({
          numberSet: setIndex + 1,
          weightKg: set.weightKg!,
          reps: set.reps!,
          rpe: set.rpe,
        })),
      });
    }

    this.exercisesSelected.emit(routineExerciseResponseToCreate);
    this.close();
  }

  private toDraft(exercise: RoutineExerciseResponse): ExerciseDraft {
    return {
      id: exercise.id,
      exerciseTemplate: exercise.exerciseTemplate,
      notes: exercise.notes ?? '',
      sets: [...exercise.sets]
        .sort((a, b) => a.numberSet - b.numberSet)
        .map(({ weightKg, reps, rpe }) => ({ weightKg, reps, rpe })),
    };
  }

  private updateDraft(exerciseId: number, change: (draft: ExerciseDraft) => ExerciseDraft): void {
    this.selectedExercises.update(current => {
      const draft = current.get(exerciseId);
      if (!draft) return current;
      return new Map(current).set(exerciseId, change(draft));
    });
  }

  private isSetValid(set: SetDraft): boolean {
    return set.weightKg !== null && set.reps !== null
      && !this.hasInvalidWeight(set) && !this.hasInvalidReps(set) && !this.hasInvalidRpe(set);
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
