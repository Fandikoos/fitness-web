import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { ProgramService } from '../../../core/services/program.service';
import { CreateRoutineStateService } from '../../../core/services/create-routine-state.service';

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

  editProgram(idProgram: number) {
    if (idProgram == null) {
      return;
    }

    this.createRoutineState.programId.set(idProgram);
    this.router.navigate(['/create/step-2']);
  }
}

