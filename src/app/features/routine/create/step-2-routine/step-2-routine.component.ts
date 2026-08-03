import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CreateRoutineStateService } from '../../../../core/services/create-routine-state.service';
import { CreateHeaderComponent } from '../create-header.component';
import { SelectExercisesComponent } from '../../../exercise/select-exercises/select-exercises.component';

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

  programId = this.createRoutineState.programId;
  dayOfWeeks = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  ngOnInit(): void {
    // TODO SE DESCOMENTARÁ
    // Se comenta por ahora para que eld esarrollo sea mas facil
    // if (this.programId() === null) {
    //   this.router.navigate(['/create/step-1']);
    // }
  }

  onBack(): void {
    this.router.navigate(['/create/step-1']);
  }

  onSave(): void {
    // TODO: save routine exercises
  }
}
