import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CreateRoutineStateService } from '../../../core/services/create-routine-state.service';

@Component({
  selector: 'app-dashboard-routine',
  imports: [
    RouterLink,
  ],
  templateUrl: './dashboard-routine.component.html',
  styleUrl: './dashboard-routine.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardRoutineComponent {
  private router = inject(Router);
  private createRoutineState = inject(CreateRoutineStateService);

  startNewProgram(): void {
    this.createRoutineState.reset();
    this.router.navigate(['/create/step-1']);
  }
}
