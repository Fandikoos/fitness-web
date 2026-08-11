import { ChangeDetectionStrategy, Component, ElementRef, inject, OnInit, output, signal, viewChild } from '@angular/core';
import { ExerciseService } from '../../../core/services/exercise.service';
import { ExerciseTemplateResponse } from '../../../shared/interfaces/exercise-template.interface';

@Component({
  selector: 'app-list-exercises',
  templateUrl: './list-exercises.component.html',
  styleUrls: ['./list-exercises.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListExercisesComponent implements OnInit {

  private exerciseService = inject(ExerciseService);

  exercisesSelected = output<ExerciseTemplateResponse[]>();

  exercises = signal<ExerciseTemplateResponse[]>([]);
  selection = signal<Set<number>>(new Set());
  loading = signal(false);
  error = signal<string | null>(null);

  private dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('exerciseDialog');

  ngOnInit(): void {
    this.loadExercises();
  }

  open(): void {
    this.selection.set(new Set());
    this.dialogRef().nativeElement.showModal();
  }

  close(): void {
    this.dialogRef().nativeElement.close();
  }

  toggleExercise(id: number): void {
    this.selection.update(current => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  isSelected(id: number): boolean {
    return this.selection().has(id);
  }

  confirm(): void {
    const selectedExercises = this.exercises().filter(e => this.selection().has(e.id));
    this.exercisesSelected.emit(selectedExercises);
    this.close();
  }

  private loadExercises(): void {
    this.loading.set(true);
    this.error.set(null);
    this.exerciseService.getAll().subscribe({
      next: (data) => {
        this.exercises.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load exercises');
        this.loading.set(false);
      },
    });
  }
}
