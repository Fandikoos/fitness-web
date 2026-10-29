import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { ProgramService } from '../../../core/services/program.service';
import { CreateRoutineStateService } from '../../../core/services/create-routine-state.service';
import { ProgramResponse } from '../../../shared/interfaces/program.interface';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-list-routine',
  imports: [RouterLink, ConfirmDialog],
  templateUrl: './list-programs.component.html',
  styleUrls: ['./list-programs.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListRoutineComponent {

  private programService = inject(ProgramService);
  private router = inject(Router);
  private createRoutineState = inject(CreateRoutineStateService);

  deleteDialog = viewChild.required<ConfirmDialog>('deleteDialog');
  errorDialog = viewChild.required<ConfirmDialog>('errorDialog');

  programToDelete = signal<ProgramResponse | null>(null);

  deleteMessage = computed(() => {
    const program = this.programToDelete();
    if (!program) {
      return '';
    }
    const routines = program.routines.length;
    const routinesText = routines === 1 ? '1 routine' : `${routines} routines`;
    return `"${program.name}" will be permanently deleted, along with its ${routinesText} and all their exercises and sets. This action cannot be undone.`;
  });

  programs = rxResource({
    loader: () => this.programService.getAll(),
  });

  startNewProgram(): void {
    this.createRoutineState.reset();
    this.router.navigate(['/create/step-1']);
  }

  editProgram(idProgram: number) {
    if (idProgram == null) {
      return;
    }

    this.createRoutineState.programId.set(idProgram);
    this.router.navigate(['/create/step-2']);
  }

  prepareDeleteProgram(program: ProgramResponse) {
    this.programToDelete.set(program);
    this.deleteDialog().open();
  }

  // Only called when the user clicks "Delete" in the dialog; Cancel/Esc/backdrop do nothing
  deleteProgram() {
    const program = this.programToDelete();
    if (program === null) {
      return;
    }

    this.programService.deleteProgram(program.id).subscribe({
      next: () => {
        this.programToDelete.set(null);
        this.programs.reload();
      },
      error: (error) => {
        console.error('Error deleting program:', error);
        this.errorDialog().open();
      }
    });
  }
}
