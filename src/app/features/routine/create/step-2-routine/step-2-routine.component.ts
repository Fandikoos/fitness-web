import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CreateRoutineStateService } from '../../../../core/services/create-routine-state.service';
import { CreateHeaderComponent } from '../create-header.component';
import { SelectExercisesComponent } from '../../../exercise/select-exercises/select-exercises.component';
import { ProgramResponse } from '../../../../shared/interfaces/program.interface';
import { RoutineService } from '../../../../core/services/routine.service';
import { RoutineResponse } from '../../../../shared/interfaces/routine.interface';
import { ProgramService } from '../../../../core/services/program.service';

@Component({
  selector: 'app-step-2-routine',
  imports: [CreateHeaderComponent, SelectExercisesComponent],
  templateUrl: './step-2-routine.component.html',
  styleUrl: './step-2-routine.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Step2RoutineComponent implements OnInit {
  private router = inject(Router);
  private createRoutineState = inject(CreateRoutineStateService);
  private routineService = inject(RoutineService);
  private programService = inject(ProgramService);

  programId = this.createRoutineState.programId;
  routines = signal<RoutineResponse[]>([]);
  dayOfWeeks = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  ngOnInit(): void {
    const id = this.programId();
    if (id === null) {
      this.router.navigate(['/create/step-1']);
      return;
    }

    this.loadPossibleRoutinesById(id);
  }

  onBack(): void {
    this.router.navigate(['/create/step-1']);
  }

  onCancel(): void {
    this.createRoutineState.reset();
    this.router.navigate(['/']);
  }

  onFinalize(): void {
    window.alert('Routine finalized successfully!');
    this.createRoutineState.reset();
    this.router.navigate(['/']);
  }

  private loadPossibleRoutinesById(programId: number): void {
    this.routineService.getByProgramId(programId).subscribe({
      next: (response) => {
        console.log('Fetched routines by program ID:', response);
        this.routines.set(response);
      },
      error: (error) => {
        console.error('Error fetching routines by program ID:', error);
      }
    });
  }
}

