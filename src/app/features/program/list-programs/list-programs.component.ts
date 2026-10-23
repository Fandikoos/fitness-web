import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { ProgramService } from '../../../core/services/program.service';
import { CreateRoutineStateService } from '../../../core/services/create-routine-state.service';
import { httpResource } from '@angular/common/http';

@Component({
  selector: 'app-list-routine',
  imports: [RouterLink],
  templateUrl: './list-programs.component.html',
  styleUrls: ['./list-programs.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListRoutineComponent {

  private programService = inject(ProgramService);
  private router = inject(Router);
  private createRoutineState = inject(CreateRoutineStateService);

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

  prepareDeleteProgram(idProgram: number, nameProgram: string) {
    window.alert(`Are you sure you want to delete this program ${nameProgram}?`);

    this.programService.deleteProgram(idProgram).subscribe({
      next: () => {
        // Recarga automaticamente el resource después de eliminar el programa
        this.programs.reload();
      },
      error: (error) => {
        console.error('Error deleting program:', error);
        window.alert('Failed to delete program. Please try again later.');
      }
    });
  }
}

